import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Phone, Briefcase, FileText, UserPlus, Save, Loader2, RefreshCw, Search, ChevronLeft, ChevronRight, Users, CheckCircle2, AlertCircle, BarChart3, TrendingUp, MessageCircle, MessageSquare, Mail, StickyNote, Download } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip,
  Legend, CartesianGrid, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { restClient } from '@/utils/api';
import { toast } from '@/components/ui/use-toast';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';
import Messages from '@/components/recruiter/Messages';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function CareerServicesDashboard() {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const isRTL = language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  const [view, setView] = useState<'candidates' | 'analytics' | 'messages'>('candidates');
  const [candidates, setCandidates] = useState<any[]>([]);
  const { hasRole } = useAuth();
  // Owner decision 2026-08-17: career-services operators allocate coaches;
  // call-centre agents read this CRM but do not. The backend enforces it
  // (caseload_states.COACH_ASSIGN_ROLES) — this only avoids showing an agent a
  // control that would 403.
  const mayAssignCoach = ['career_services_operator', 'admin', 'administrator',
    'super_user', 'super_admin', 'platform_administrator'].some(r => hasRole(r));
  const [operators, setOperators] = useState<any[]>([]);
  // Career-coach allocation for the candidate open in the sheet.
  const [coaches, setCoaches] = useState<any[]>([]);
  const [coachAssignment, setCoachAssignment] = useState<any | null>(null);
  const [coachBusy, setCoachBusy] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters and Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [callStatusFilter, setCallStatusFilter] = useState('All');
  const [workStatusFilter, setWorkStatusFilter] = useState('All');
  const [segmentFilter, setSegmentFilter] = useState('All');
  /* The additional facets (#364) live in ONE object rather than nine useState
     hooks: the fetch effect then has a single dependency, and "clear all" and
     the active-filter count are trivial instead of nine-way bookkeeping. */
  const [extraFilters, setExtraFilters] = useState<Record<string, string>>({});
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Editing Sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  // Interaction history for the candidate in the sheet (fb_1786356071_38fe48a4).
  const [history, setHistory] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  // When the roster genuinely last came from NAFIS. The refresh button below
  // re-reads this database and contacts NAFIS not at all, so its own timestamp
  // would say nothing about the freshness of the data.
  const [lastImport, setLastImport] = useState<any>(null);
  // Paging and the headline counts are computed in SQL now, so they arrive
  // with the page rather than being derived from an in-browser roster.
  const [pageMeta, setPageMeta] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  // Anonymised and consent-test rows have no contact details, so an agent
  // working the call list only discovers that after opening them.
  const [hideUncontactable, setHideUncontactable] = useState(false);
  const [quickRemarkFor, setQuickRemarkFor] = useState<any>(null);
  const [quickRemark, setQuickRemark] = useState('');
  const [savingQuickRemark, setSavingQuickRemark] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchOperators();
    fetchCoaches();
    fetchLastImport();
    fetchStats();
  }, []);

  // Every page, search or filter change is a new query. The search box is
  // debounced so typing an Emirates ID does not fire fifteen queries against
  // a table that will eventually hold every Dubai national.
  useEffect(() => {
    const id = setTimeout(() => { fetchCandidates(); }, searchTerm ? 350 : 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, callStatusFilter, workStatusFilter, segmentFilter,
      hideUncontactable, JSON.stringify(extraFilters)]);

  /* Dropdown values come from the roster itself, so the UI can only ever offer
     values that exist — and can say a facet is unavailable rather than showing
     an empty menu (marital_status has 1 row in 5,297). */
  useEffect(() => {
    restClient.get('/api/profile/crm-filter-options')
      .then(r => setFilterOptions(r.data?.data || null))
      .catch(() => setFilterOptions(null));
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

  /* The filter half of the roster query, in ONE place.

     Both the page fetch and "select all matching" send these. Building them
     twice is how the ids an operator acts on drift from the rows they were
     shown — the same reason the backend derives ids from the page query rather
     than a second one. */
  const filterParams = (base: Record<string, string> = {}) => {
    const p = new URLSearchParams(base);
    if (searchTerm.trim()) p.set('q', searchTerm.trim());
    if (callStatusFilter !== 'All') p.set('call_status', callStatusFilter);
    if (workStatusFilter !== 'All') p.set('work_status', workStatusFilter);
    if (segmentFilter !== 'All') p.set('segment', segmentFilter);
    if (hideUncontactable) p.set('hide_uncontactable', 'true');
    Object.entries(extraFilters).forEach(([k, v]) => { if (v) p.set(k, v); });
    return p;
  };

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      // Search, filters and paging are applied in SQL. This used to pull the
      // whole roster down so the browser could do it: 5.5 MB and 3.7 seconds
      // at 5,310 candidates, and every candidate's Emirates ID, phone and
      // counselling notes shipped to the client in order to show twenty rows.
      // The platform targets every Dubai national aged 15 and over.
      const params = filterParams({
        page: String(currentPage),
        per_page: String(itemsPerPage),
        _cb: String(Date.now()),
      });
      const res = await restClient.get(`/api/profile/crm-candidates?${params.toString()}`);
      if (res.data?.success && res.data?.data) {
        setPageMeta(res.data.pagination || null);
        setSummary(res.data.summary || null);
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
            // NAFIS-sourced record, read-only (fb_1786426324_770d7191).
            nafis: {
              gender: profile.gender,
              ageGroup: profile.age_group,
              jobSeekerType: profile.job_seeker_type,
              emirateOfResidence: profile.emirate_of_residence,
              educationLevel: profile.education_level,
              specialization: profile.specialization,
              subSpecialization: profile.sub_specialization,
              gpa: profile.gpa,
              isStudent: profile.is_student,
              militaryStatus: profile.military_status,
              maritalStatus: profile.marital_status,
              personOfDetermination: profile.is_person_of_determination,
              determinationType: profile.determination_type,
              nationality: profile.nationality,
              addedAt: profile.added_at,
            },
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

  const fetchCoaches = async () => {
    try {
      const res: any = await restClient.get('/api/caseload/operators?role=coach');
      setCoaches(res?.data?.operators || res?.operators || []);
    } catch { setCoaches([]); }
  };

  /* The candidate's NAFIS record, shown read-only in the sheet (fb_1786426324).
     
     Staff asked to see what NAFIS already knows — gender, age range,
     registration date, jobseeker date, person of determination, marital status
     — rather than only what the CRM sheet carried. NAFIS is the source, so
     nothing here is editable: anything typed over it would be replaced by the
     next import. */
  const [nafis, setNafis] = useState<any | null>(null);
  const [nafisState, setNafisState] = useState<'idle' | 'loading' | 'none' | 'error' | 'ok'>('idle');

  const loadNafis = async (candidateId: string) => {
    setNafis(null); setNafisState('loading');
    try {
      const res: any = await restClient.get(`/api/profile/crm-candidates/${candidateId}/nafis`);
      const data = res?.data?.data ?? null;
      /* Three different outcomes, three different messages. "No NAFIS record"
         is a fact about the candidate; "could not load" is a fact about us. */
      if (data) { setNafis(data); setNafisState('ok'); } else { setNafisState('none'); }
    } catch {
      setNafisState('error');
    }
  };

  const loadCoachAssignment = async (candidateId: string) => {
    setCoachAssignment(null); setCoachError(null);
    try {
      // ?member_id= asks "who is this person assigned to" directly. Fetching
      // every active assignment and filtering here would scale with the whole
      // caseload, not with the one candidate on screen.
      const res: any = await restClient.get(`/api/caseload/coach?member_id=${encodeURIComponent(candidateId)}`);
      const rows = res?.data?.assignments || res?.assignments || [];
      setCoachAssignment(rows[0] || null);
    } catch {
      // null means "not loaded", which the panel says rather than showing
      // "no coach" — those are different claims.
      setCoachError(t('Could not load the coaching assignment.', 'تعذّر تحميل بيانات التدريب.'));
    }
  };

  const assignCoach = async (coachId: string) => {
    if (!editingCandidate) return;
    setCoachBusy(true); setCoachError(null);
    try {
      await restClient.post('/api/caseload/coach/assign',
        { staff_id: coachId, member_id: editingCandidate.id });
      await loadCoachAssignment(editingCandidate.id);
    } catch (e: any) {
      setCoachError(e?.response?.data?.error
        || t('Could not assign this coach.', 'تعذّر إسناد هذا المدرب.'));
    } finally { setCoachBusy(false); }
  };

  const unassignCoach = async () => {
    if (!editingCandidate || !coachAssignment) return;
    setCoachBusy(true); setCoachError(null);
    try {
      await restClient.post('/api/caseload/coach/unassign',
        { staff_id: coachAssignment.staff_id, member_id: editingCandidate.id });
      await loadCoachAssignment(editingCandidate.id);
    } catch (e: any) {
      setCoachError(e?.response?.data?.error
        || t('Could not remove this assignment.', 'تعذّر إزالة الإسناد.'));
    } finally { setCoachBusy(false); }
  };

  const loadHistory = async (candidateId: string) => {
    setHistory(null); setHistoryLoading(true);
    try {
      const r = await restClient.get(`/api/profile/crm-candidates/${candidateId}/history`);
      setHistory(r.data?.data || null);
    } catch {
      // null = could not load, which the panel states as such rather than
      // showing an empty timeline that reads as "nothing ever happened".
      setHistory(null);
    } finally { setHistoryLoading(false); }
  };

  const handleEditClick = (candidate: any) => {
    loadHistory(candidate.id);
    loadCoachAssignment(candidate.id);
    loadNafis(candidate.id);
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

  // The API returns exactly the rows for this page, already searched and
  // filtered, so the table renders them as they arrive. The client-side
  // filtering that used to live here went with the whole-roster fetch it
  // depended on.
  const filteredCandidates = candidates;
  const paginatedCandidates = candidates;
  const totalCandidates = pageMeta?.total ?? 0;
  const totalPages = Math.max(pageMeta?.total_pages ?? 1, 1);
  const activePage = pageMeta?.page ?? currentPage;
  const uncontactableCount = summary?.uncontactable ?? 0;

  // KPIs are counted in SQL across the whole filtered set. Deriving them from
  // `candidates` would now describe only the twenty rows on screen and
  // silently understate every figure.
  const totalCount = summary?.total ?? 0;
  const contactedCount = summary?.contacted ?? 0;
  const noAnswerCount = summary?.no_answer ?? 0;
  const unassignedCount = summary?.unassigned ?? 0;

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
  /**
 * Controlled vocabularies for the Edit Details form (#364).
 *
 * These were free-text inputs. Two operators asked for dropdowns so entry is
 * consistent and the values stay filterable.
 *
 * The strings below are the values ALREADY STORED in candidate_profiles, copied
 * exactly — including the curly apostrophe (U+2019) in "Didn’t receive updated
 * CV", which 483 records use. A straight apostrophe here would fail to match
 * those rows and every one of them would render blank.
 *
 * Anything already in the data that is not in these lists is preserved and shown
 * rather than silently dropped: an operator's entry is not ours to discard.
 */
const CV_STATUS_OPTIONS = [
  'Received updated CV',
  'Didn\u2019t receive updated CV',
] as const;

/** The seven emirates, plus Hatta which is already in use (19 records). */
const LOCATION_OPTIONS = [
  'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman',
  'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah', 'Hatta',
] as const;

  const FACET_LABELS: Record<string, [string, string]> = {
    gender: ['Gender', 'الجنس'],
    age_group: ['Age Group', 'الفئة العمرية'],
    education_level: ['Education', 'المؤهل'],
    cv_status: ['CV Status', 'حالة السيرة'],
    looking_status: ['Looking Status', 'حالة البحث'],
    preferred_location: ['Preferred Location', 'الموقع المفضل'],
    preferred_sector: ['Preferred Sector', 'القطاع المفضل'],
    candidates_source: ['Source', 'المصدر'],
    assigned_to: ['Assigned To', 'مُسند إلى'],
    marital_status: ['Marital Status', 'الحالة الاجتماعية'],
  };
  /* Every facet the backend can filter on needs a label here: the dropdowns are
     rendered by iterating THIS map, so a facet missing from it stays invisible
     however much data arrives. marital_status is listed even though the roster
     is currently too sparse to offer it — the backend decides that per request
     from live counts, and this is what lets the menu appear on its own when the
     data lands rather than waiting for someone to notice. */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAssignee, setBulkAssignee] = useState('');
  const [bulkCallStatus, setBulkCallStatus] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  /* The row's identity is `id` (the user's Emirates ID). NOT `eid`, which the
     row mapper sets to the literal '-' whenever national_id is absent — using it
     collapsed every such candidate onto one selection key (17 selected from 20
     visible rows) and would have posted '-' to the bulk endpoint as a user_id. */
  const pageIds = paginatedCandidates.map((c: any) => String(c.id));
  const allOnPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));
  const toggleOne = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  /* Selects THIS PAGE only, and says so. "Select all" across 5,311 records
     would let one click change a set the operator has never seen. */
  const togglePage = () =>
    setSelectedIds(prev => allOnPageSelected
      ? prev.filter(id => !pageIds.includes(id))
      : [...new Set([...prev, ...pageIds])]);

  /* Selecting the whole FILTERED set — explicitly, and never as a side effect
     of the header checkbox.

     The page-only rule above stands: a checkbox that silently means "everything"
     is the thing worth preventing. But inviting a filtered cohort to an open day
     twenty at a time is not a workflow (feedback fb_1787130514, on a filter
     matching 3,662 people), so this is a separate control that states the count
     before it acts. The operator opts in to a number they can see.

     It fetches the concrete ids rather than switching the bulk call to a
     filter-wide update: the bulk endpoint documents why it takes explicit
     user_ids — a filter shifting under the operator would otherwise change the
     blast radius after they clicked. Both properties survive. */
  const [selectingAll, setSelectingAll] = useState(false);
  const selectAllMatching = async () => {
    setSelectingAll(true);
    try {
      const qs = filterParams({ ids_only: '1' }).toString();
      const res: any = await restClient.get(`/api/profile/crm-candidates?${qs}`);
      const ids: string[] = res?.data?.data?.ids || res?.data?.ids || [];
      setSelectedIds(ids.map(String));
    } catch {
      // Leave the existing selection alone rather than half-selecting: a
      // partial set the operator believes is complete is worse than none.
    } finally { setSelectingAll(false); }
  };

  /* Inviting to an open day is the same motion as any other bulk action here:
     filter the roster, select, act (#376). The invitation is RECORDED here and
     DELIVERED on the call the agent then makes — there is no message to send. */
  const [openDayEvents, setOpenDayEvents] = useState<any[]>([]);
  const [inviteEventId, setInviteEventId] = useState('');
  useEffect(() => {
    restClient.get('/api/events')
      .then(r => setOpenDayEvents((r.data?.data || []).filter((e: any) => e.status === 'published')))
      .catch(() => setOpenDayEvents([]));
  }, []);

  const inviteToEvent = async () => {
    if (!inviteEventId || !selectedIds.length) return;
    setBulkBusy(true);
    try {
      const res = await restClient.post(`/api/events/${inviteEventId}/invitations`,
        { candidate_ids: selectedIds });
      const d = res.data?.data || {};
      toast({
        title: t(`${d.invited} added to the call list`, `تمت إضافة ${d.invited} إلى قائمة الاتصال`),
        // Report what did NOT change as well as what did — the same rule as the
        // other bulk actions. Re-inviting is a no-op server-side, not an error.
        description: (d.already_invited || d.unknown)
          ? t(`${d.already_invited} were already on it, ${d.unknown} not found.`,
              `${d.already_invited} موجودون بالفعل، ${d.unknown} غير موجودين.`)
          : undefined,
      });
      setSelectedIds([]); setInviteEventId('');
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || t('Could not add them', 'تعذّرت الإضافة'),
              variant: 'destructive' });
    } finally { setBulkBusy(false); }
  };

  const applyBulk = async () => {
    if (!selectedIds.length || (!bulkAssignee && !bulkCallStatus)) return;
    setBulkBusy(true);
    try {
      const body: any = { user_ids: selectedIds };
      if (bulkCallStatus) body.call_status = bulkCallStatus;
      if (bulkAssignee) body.assigned_to = bulkAssignee === '__unassign__' ? '' : bulkAssignee;
      const res = await restClient.post('/api/profile/crm-candidates/bulk', body);
      const d = res.data?.data || {};
      toast({
        title: t(`${d.updated} candidate${d.updated === 1 ? '' : 's'} updated`,
                 `تم تحديث ${d.updated} مرشح`),
        // Report what did NOT change too — an operator who selected 50 and
        // changed 30 must be told, not left to assume.
        description: (d.skipped || d.not_found)
          ? t(`${d.skipped} not on your caseload, ${d.not_found} not found.`,
              `${d.skipped} خارج قائمتك، ${d.not_found} غير موجود.`)
          : undefined,
      });
      setSelectedIds([]); setBulkAssignee(''); setBulkCallStatus('');
      fetchCandidates();
    } catch (e: any) {
      toast({
        title: e?.response?.data?.message || t('The bulk update failed', 'تعذّر التحديث الجماعي'),
        description: t('Nothing was changed.', 'لم يتم تغيير أي شيء.'),
        variant: 'destructive',
      });
    } finally { setBulkBusy(false); }
  };

  const [exporting, setExporting] = useState(false);
  /* Downloads exactly what the operator is looking at: the same filters, sent to
     an endpoint that shares the list's query builder. Streamed through the API
     rather than assembled in the browser, so the file cannot silently differ
     from the roster and every export is auditable server-side. */
  const exportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('q', searchTerm.trim());
      if (callStatusFilter !== 'All') params.set('call_status', callStatusFilter);
      if (workStatusFilter !== 'All') params.set('work_status', workStatusFilter);
      if (segmentFilter !== 'All') params.set('segment', segmentFilter);
      if (hideUncontactable) params.set('hide_uncontactable', 'true');
      Object.entries(extraFilters).forEach(([k, v]) => { if (v) params.set(k, v); });

      const res = await restClient.get(
        `/api/profile/crm-candidates/export?${params.toString()}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `crm-candidates-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: t('The export could not be produced', 'تعذّر إنشاء ملف التصدير'),
        description: t('Nothing was downloaded. Please try again, and report it if it persists.',
                       'لم يتم تنزيل أي ملف. يرجى المحاولة مرة أخرى والإبلاغ إذا استمرت المشكلة.'),
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const activeExtraCount = Object.values(extraFilters).filter(Boolean).length;
  const setFacet = (key: string, val: string) => {
    setExtraFilters(prev => {
      const next = { ...prev };
      if (!val || val === 'All') delete next[key]; else next[key] = val;
      return next;
    });
    setCurrentPage(1);
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
                <div className="flex items-center gap-2">
                  <Button onClick={() => { fetchCandidates(); fetchLastImport(); }} variant="outline"
                          className="gap-2 bg-white shadow-sm hover:bg-slate-50 border-slate-200 rounded-xl transition-all">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#006E6D]' : 'text-slate-500'}`} />
                    {t('Refresh list', 'تحديث القائمة')}
                  </Button>
                  {/* Exports exactly what the current filters show — it reuses the
                      same query the list does. Requested "next to Refresh List". */}
                  <Button onClick={exportCsv} disabled={exporting} variant="outline"
                          className="gap-2 bg-white shadow-sm hover:bg-slate-50 border-slate-200 rounded-xl transition-all">
                    {exporting
                      ? <RefreshCw className="h-4 w-4 animate-spin text-[#006E6D]" />
                      : <Download className="h-4 w-4 text-slate-500" />}
                    {t('Export CSV', 'تصدير CSV')}
                  </Button>
                </div>
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

              {/* ── Additional filters (#364) ──────────────────────────────
                  Operators asked to COMBINE filters over 5,311 records —
                  Gender + Education, Age + Gender, Working Status + Gender.
                  Values and counts come from the roster itself, so a facet can
                  never offer something that does not exist, and an operator can
                  see how many records a choice will return BEFORE applying it.
                  That distinction matters: a filter that returns nothing is
                  otherwise indistinguishable from a filter that is broken. */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowMoreFilters(v => !v)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  {showMoreFilters ? '▾' : '▸'} {t('More filters', 'مزيد من عوامل التصفية')}
                  {activeExtraCount > 0 && (
                    <span className="rounded-full bg-ehrdc-teal px-2 py-0.5 text-[11px] font-semibold text-white">
                      {activeExtraCount}
                    </span>
                  )}
                </button>
                {activeExtraCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { setExtraFilters({}); setCurrentPage(1); }}
                    className="ms-2 text-xs text-slate-500 underline hover:text-slate-700"
                  >
                    {t('Clear all', 'مسح الكل')}
                  </button>
                )}

                {showMoreFilters && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.keys(FACET_LABELS).map(key => {
                        const opts = filterOptions?.options?.[key] || [];
                        if (!opts.length) return null;
                        const [en, ar] = FACET_LABELS[key];
                        return (
                          <div key={key} className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">{t(en, ar)}</label>
                            <Select value={extraFilters[key] || 'All'} onValueChange={(v) => setFacet(key, v)}>
                              <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-10 text-sm">
                                <SelectValue placeholder={t('Any', 'الكل')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="All">{t('Any', 'الكل')}</SelectItem>
                                {opts.map((o: any) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.value} ({o.count})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })}

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">
                          {t('Call date from', 'تاريخ الاتصال من')}
                        </label>
                        <Input type="date" value={extraFilters.date_from || ''}
                               min={filterOptions?.date_of_call?.min || undefined}
                               max={filterOptions?.date_of_call?.max || undefined}
                               onChange={(e) => setFacet('date_from', e.target.value)}
                               className="bg-slate-50 border-slate-200 rounded-xl h-10 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">
                          {t('Call date to', 'تاريخ الاتصال إلى')}
                        </label>
                        <Input type="date" value={extraFilters.date_to || ''}
                               min={filterOptions?.date_of_call?.min || undefined}
                               max={filterOptions?.date_of_call?.max || undefined}
                               onChange={(e) => setFacet('date_to', e.target.value)}
                               className="bg-slate-50 border-slate-200 rounded-xl h-10 text-sm" />
                      </div>
                    </div>

                    {/* Name what there is not yet enough data to filter on, rather
                        than leaving an empty menu that looks like a fault.

                        The backend sends counts, not a sentence: it reports how
                        many records carry the field, and the phrasing (and its
                        Arabic) is decided here. That way the note states a
                        measurement — "recorded for 1 of 5,298" — instead of
                        asserting the field is never collected, which is a claim
                        that would quietly go stale as the roster fills. */}
                    {filterOptions?.unavailable && Object.keys(filterOptions.unavailable).length > 0 && (
                      <p className="mt-3 text-[11px] text-slate-500">
                        {t('Not enough data to filter on yet: ', 'لا توجد بيانات كافية للتصفية بعد: ')}
                        {Object.entries(filterOptions.unavailable)
                          .map(([k, info]: [string, any]) => {
                            const lbl = FACET_LABELS[k];
                            const label = lbl ? t(lbl[0], lbl[1])
                              : k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                            const n = (info?.populated ?? 0).toLocaleString(isRTL ? 'ar-AE' : 'en-GB');
                            const total = (filterOptions?.roster_total ?? 0).toLocaleString(isRTL ? 'ar-AE' : 'en-GB');
                            return `${label} — ${t(`recorded for ${n} of ${total}`, `مُسجّل لـ ${n} من ${total}`)}`;
                          })
                          .join(' · ')}
                      </p>
                    )}
                    {filterOptions?.date_of_call?.min && (
                      <p className="mt-1 text-[11px] text-slate-400">
                        {t(`Call dates on record run ${filterOptions.date_of_call.min} to ${filterOptions.date_of_call.max} across ${filterOptions.date_of_call.count} candidates.`,
                           `تواريخ الاتصال المسجلة من ${filterOptions.date_of_call.min} إلى ${filterOptions.date_of_call.max} لـ ${filterOptions.date_of_call.count} مرشحاً.`)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <CardContent className="p-0">
              {/* Bulk action bar (#364). Appears only with a selection, and states
                  exactly how many records the next click will change — a bulk
                  action whose blast radius is not on screen is how 100 people get
                  reassigned by accident. */}
              {selectedIds.length > 0 && (
                <div className="sticky top-16 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-ehrdc-teal/30 bg-teal-50/90 px-4 py-3 backdrop-blur">
                  <span className="text-sm font-semibold text-slate-800">
                    {t(`${selectedIds.length} selected`, `${selectedIds.length} محدد`)}
                  </span>
                  <button type="button" onClick={() => setSelectedIds([])}
                          className="text-xs text-slate-600 underline hover:text-slate-800">
                    {t('Clear', 'إلغاء التحديد')}
                  </button>

                  {/* Offered only when the filter matches more than the page can
                      show, and it NAMES the number before acting. The header
                      checkbox stays page-only: the risk worth preventing is a
                      click that silently means "everything", not the operator
                      deliberately choosing a set whose size they can see. */}
                  {pageMeta && pageMeta.total > selectedIds.length && (
                    <button type="button" onClick={selectAllMatching} disabled={selectingAll}
                            className="text-xs font-medium text-ehrdc-teal underline hover:text-teal-800 disabled:opacity-50">
                      {selectingAll
                        ? t('Selecting…', 'جارٍ التحديد…')
                        : t(`Select all ${pageMeta.total} matching this filter`,
                            `تحديد كل ${pageMeta.total} المطابقين لهذا الفلتر`)}
                    </button>
                  )}

                  <div className="mx-2 h-5 w-px bg-teal-200" />

                  <Select value={bulkAssignee} onValueChange={setBulkAssignee}>
                    <SelectTrigger className="h-9 w-full sm:w-[210px] bg-white border-slate-200 rounded-lg text-sm">
                      <SelectValue placeholder={t('Assign to…', 'إسناد إلى…')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unassign__">{t('Unassign', 'إلغاء الإسناد')}</SelectItem>
                      {operators.map((o: any) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.full_name || o.name || o.email || o.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={bulkCallStatus} onValueChange={setBulkCallStatus}>
                    <SelectTrigger className="h-9 w-full sm:w-[180px] bg-white border-slate-200 rounded-lg text-sm">
                      <SelectValue placeholder={t('Set call status…', 'تعيين حالة الاتصال…')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Answered">Answered</SelectItem>
                      <SelectItem value="No Answer">No Answer</SelectItem>
                      <SelectItem value="Invalid Number">Invalid Number</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Only shown when there is a published event to invite to,
                      so the control cannot offer an action that goes nowhere. */}
                  {openDayEvents.length > 0 && (
                    <>
                      <div className="mx-1 h-5 w-px bg-teal-200" />
                      <Select value={inviteEventId} onValueChange={setInviteEventId}>
                        <SelectTrigger className="h-9 w-full sm:w-[200px] bg-white border-slate-200 rounded-lg text-sm">
                          <SelectValue placeholder={t('Invite to open day…', 'دعوة إلى يوم مفتوح…')} />
                        </SelectTrigger>
                        <SelectContent>
                          {openDayEvents.map((e: any) => (
                            <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" className="h-9"
                              onClick={inviteToEvent} disabled={bulkBusy || !inviteEventId}>
                        {t(`Invite ${selectedIds.length}`, `دعوة ${selectedIds.length}`)}
                      </Button>
                    </>
                  )}

                  <Button size="sm" onClick={applyBulk}
                          disabled={bulkBusy || (!bulkAssignee && !bulkCallStatus)}
                          className="h-9 gap-2">
                    {bulkBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t(`Apply to ${selectedIds.length}`, `تطبيق على ${selectedIds.length}`)}
                  </Button>
                </div>
              )}
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
                      <th className="px-3 py-4 w-10">
                        <input type="checkbox" checked={allOnPageSelected} onChange={togglePage}
                               className="h-4 w-4 rounded border-slate-300"
                               aria-label={t('Select all on this page', 'تحديد كل ما في هذه الصفحة')} />
                      </th>
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
                        <td className="px-3 py-4">
                          <input type="checkbox"
                                 checked={selectedIds.includes(String(candidate.id))}
                                 onChange={() => toggleOne(String(candidate.id))}
                                 className="h-4 w-4 rounded border-slate-300"
                                 aria-label={t('Select candidate', 'تحديد المرشح')} />
                        </td>
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
                          <div className="flex items-center justify-end gap-2">
                            {/* Restored (fb_1786420709_7d087bfd). The reporter
                                said this "was previously available" and had been
                                removed. The ROUTE was widened months ago to admit
                                career_services_operator and call_center_agent
                                precisely so it would work — see the comment on
                                /candidate-profile/:candidateId in App.tsx — but
                                the control itself was never put back. The
                                destination was fixed and the door left off.
                                It also answers "View Application": that page
                                carries the candidate's recent applications, so
                                one link serves both. There is deliberately no
                                separate application link — /applications is the
                                candidate's own page and there is no operator
                                view to point at. */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/candidate-profile/${candidate.id}`)}
                              className="text-slate-600 hover:text-[#006E6D] hover:bg-[#F0F7F7] rounded-lg"
                            >
                              {t('View full profile', 'عرض الملف الكامل')}
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleEditClick(candidate)} 
                              className="bg-white text-[#006E6D] border border-[#006E6D]/20 hover:bg-[#F0F7F7] shadow-sm rounded-lg transition-opacity"
                            >
                              {t('Edit Details', 'تعديل التفاصيل')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {!loading && totalCandidates > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  {t('Showing', 'عرض')} <span className="font-medium text-slate-900">{(activePage - 1) * itemsPerPage + 1}</span> {t('to', 'إلى')} <span className="font-medium text-slate-900">{Math.min(activePage * itemsPerPage, totalCandidates)}</span> {t('of', 'من')} <span className="font-medium text-slate-900">{totalCandidates.toLocaleString()}</span> {t('candidates', 'مرشحين')}
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

                {/* NAFIS record — read-only (fb_1786426324). */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-800">
                      {t('NAFIS record', 'سجل نافس')}
                    </h4>
                    <span className="text-xs text-slate-500">
                      {t('From NAFIS — not editable here', 'من نافس — غير قابل للتعديل هنا')}
                    </span>
                  </div>

                  {nafisState === 'loading' ? (
                    <p className="text-sm text-slate-500">{t('Loading…', 'جارٍ التحميل…')}</p>
                  ) : nafisState === 'error' ? (
                    <p className="text-sm text-amber-700">
                      {t('The NAFIS record could not be loaded.', 'تعذّر تحميل سجل نافس.')}
                    </p>
                  ) : nafisState === 'none' ? (
                    <p className="text-sm text-slate-500">
                      {t('No NAFIS record is linked to this candidate.',
                         'لا يوجد سجل نافس مرتبط بهذا المرشح.')}
                    </p>
                  ) : nafis ? (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                      {([
                        ['Gender', 'الجنس', nafis.gender],
                        ['Age range', 'الفئة العمرية', nafis.age_group],
                        ['Marital status', 'الحالة الاجتماعية', nafis.marital_status],
                        ['Registered on', 'تاريخ التسجيل', nafis.registered_on?.slice(0, 10)],
                        ['Jobseeker since', 'باحث عن عمل منذ', nafis.job_seeker_date?.slice(0, 10)],
                        ['Jobseeker type', 'نوع الباحث', nafis.job_seeker_type],
                        ['Education', 'المؤهل', nafis.education_level],
                        ['Specialisation', 'التخصص', nafis.specialization],
                        ['Experience (years)', 'سنوات الخبرة', nafis.experience_years],
                        ['Emirate of residence', 'إمارة الإقامة', nafis.emirate_of_residence],
                        ['National service', 'الخدمة الوطنية', nafis.national_service],
                        ['Person of determination', 'من أصحاب الهمم',
                          nafis.is_person_of_determination == null ? null
                            : (nafis.is_person_of_determination
                                ? (nafis.determination_type || t('Yes', 'نعم'))
                                : t('No', 'لا'))],
                      ] as [string, string, any][]).map(([en, ar, value]) => (
                        <div key={en}>
                          <dt className="text-[11px] uppercase tracking-wide text-slate-400">
                            {t(en, ar)}
                          </dt>
                          {/* An em-dash for a field NAFIS did not record. Blank
                              would read as "we forgot to show it", and a zero or
                              "No" would be an answer NAFIS never gave. */}
                          <dd className="text-sm text-slate-800">
                            {value === null || value === undefined || value === ''
                              ? <span className="text-slate-400">—</span>
                              : String(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>

                {/* Career coach allocation (owner decision 2026-08-17).
                    Coaching was previously reachable only if a candidate found
                    Professional Growth -> Mentorship -> Coaching and picked a
                    coach themselves — a pull model, in an operation that works
                    a prioritised queue. This is the push half. */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-800">
                      {t('Career coach', 'المدرب المهني')}
                    </h4>
                    {coachAssignment && (
                      <span className="text-xs text-slate-500">
                        {coachAssignment.origin === 'requested'
                          ? t('chosen by the candidate', 'اختاره المرشح')
                          : t('allocated by an operator', 'أسنده مشغّل')}
                      </span>
                    )}
                  </div>

                  {coachError && (
                    <p className="text-sm text-amber-700">{coachError}</p>
                  )}

                  {coachAssignment ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm text-slate-700">
                        <span className="font-medium">
                          {coachAssignment.staff_name || coachAssignment.staff_id}
                        </span>
                        {coachAssignment.assigned_at && (
                          <span className="text-slate-500">
                            {' · '}
                            {new Date(coachAssignment.assigned_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {mayAssignCoach && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); unassignCoach(); }}
                          disabled={coachBusy}
                          className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {coachBusy
                            ? t('Working…', 'جارٍ…')
                            : t('Remove assignment', 'إزالة الإسناد')}
                        </button>
                      )}
                    </div>
                  ) : !mayAssignCoach ? (
                    <p className="text-sm text-slate-500">
                      {t('No career coach assigned.', 'لا يوجد مدرب مهني معيّن.')}
                    </p>
                  ) : coaches.length === 0 ? (
                    /* Say why the picker is empty rather than showing a control
                       that cannot do anything. */
                    <p className="text-sm text-slate-500">
                      {t('No one holds the coach role yet, so there is nobody to assign.',
                         'لا يوجد أحد يحمل دور المدرب حالياً.')}
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        defaultValue=""
                        disabled={coachBusy}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { const v = e.target.value; if (v) assignCoach(v); }}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                      >
                        <option value="">
                          {coachBusy
                            ? t('Assigning…', 'جارٍ الإسناد…')
                            : t('Assign a career coach…', 'إسناد مدرب مهني…')}
                        </option>
                        {coaches.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name || c.email || c.id}</option>
                        ))}
                      </select>
                      {/* The candidate is told, so the operator should know that
                          before clicking rather than discover it afterwards. */}
                      <span className="text-xs text-slate-500">
                        {t('The candidate and the coach are both notified.',
                           'يتم إشعار المرشح والمدرب.')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Interaction history (fb_1786356071_38fe48a4).
                    "Clicking a candidate record opens a timeline view showing
                    the complete history of interaction."

                    Merges counselling changes (recorded from 15 Aug 2026) with
                    applications, open-day nominations and attendance, which the
                    platform already recorded. The counselling half necessarily
                    starts at that date: before it, candidate_profiles was
                    updated in place and the previous values are gone. The panel
                    says so, because a short history presented as a complete one
                    would mislead exactly the person relying on it. */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-800">
                      {t('Interaction history', 'سجل التفاعلات')}
                    </h4>
                    {history?.counts && (
                      <span className="text-xs text-slate-500">
                        {[
                          history.counts.counselling && t(`${history.counts.counselling} counselling`, `${history.counts.counselling} توجيه`),
                          history.counts.applied && t(`${history.counts.applied} applications`, `${history.counts.applied} طلبات`),
                          history.counts.nominated && t(`${history.counts.nominated} nominations`, `${history.counts.nominated} ترشيحات`),
                          history.counts.attended && t(`${history.counts.attended} attended`, `${history.counts.attended} حضور`),
                        ].filter(Boolean).join(' · ') || t('nothing recorded yet', 'لا يوجد سجل بعد')}
                      </span>
                    )}
                  </div>

                  {historyLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> {t('Loading history…', 'جارٍ تحميل السجل…')}
                    </div>
                  ) : !history ? (
                    <p className="text-sm text-slate-500">
                      {t('The history could not be loaded just now.', 'تعذّر تحميل السجل حالياً.')}
                    </p>
                  ) : (history.events || []).length === 0 ? (
                    <p className="text-sm text-slate-500">
                      {t('Nothing recorded for this candidate yet.', 'لا يوجد سجل لهذا المرشح بعد.')}
                    </p>
                  ) : (
                    <ol className="space-y-2">
                      {history.events.slice(0, 40).map((e: any, i: number) => {
                        const when = e.at
                          ? new Date(e.at).toLocaleString(isRTL ? 'ar-AE' : 'en-GB',
                              { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '';
                        const label = (f: string) => ({
                          call_status: t('Call status', 'حالة الاتصال'),
                          work_status: t('Work status', 'حالة العمل'),
                          cv_status: t('CV status', 'حالة السيرة'),
                          looking_status: t('Looking status', 'حالة البحث'),
                          counseling_remarks: t('Remark', 'ملاحظة'),
                          assigned_to: t('Assigned to', 'مُسند إلى'),
                          job_seeker_type: t('Job seeker type', 'نوع الباحث'),
                        } as Record<string, string>)[f] || f;
                        const dot = { counselling: 'bg-ehrdc-teal', applied: 'bg-blue-500',
                                      nominated: 'bg-amber-500', attended: 'bg-green-600' }[e.kind as string] || 'bg-slate-400';
                        return (
                          <li key={i} className="flex gap-2.5">
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-slate-800">
                                {e.kind === 'counselling' && (
                                  <>
                                    <span className="font-medium">{label(e.field)}</span>
                                    {' '}
                                    {e.from
                                      ? t(`changed from “${e.from}” to “${e.to}”`, `تغيّر من "${e.from}" إلى "${e.to}"`)
                                      : t(`set to “${e.to}”`, `تم تعيينه إلى "${e.to}"`)}
                                  </>
                                )}
                                {e.kind === 'applied' && t(
                                  `Applied for ${e.title || 'a vacancy'}${e.company ? ` at ${e.company}` : ''}${e.status ? ` — ${e.status}` : ''}`,
                                  `تقدّم لوظيفة ${e.title || ''}${e.company ? ` لدى ${e.company}` : ''}`)}
                                {e.kind === 'nominated' && t(
                                  `Nominated for ${e.title || 'an open day'}${e.response ? ` — ${e.response}` : ''}`,
                                  `رُشِّح لـ ${e.title || 'يوم مفتوح'}`)}
                                {e.kind === 'attended' && t(
                                  `Attended ${e.title || 'an open day'}${e.token ? ` (queue ${e.token})` : ''}`,
                                  `حضر ${e.title || 'يوماً مفتوحاً'}`)}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {when}{e.actor ? ` · ${e.actor}` : ''}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  )}

                  {history?.counselling_history_since && (
                    <p className="text-[11px] text-slate-500">
                      {t(`Counselling changes have been recorded since ${history.counselling_history_since}. Earlier edits overwrote the record and cannot be recovered.`,
                         `تُسجَّل تغييرات التوجيه منذ ${history.counselling_history_since}. التعديلات الأقدم استبدلت السجل ولا يمكن استرجاعها.`)}
                    </p>
                  )}
                </div>

                {/* NAFIS record — read-only (fb_1786426324_770d7191).
                    "reduce the need to access multiple systems": the roster has
                    carried these since the import and simply never showed them.

                    Read-only on purpose. These come from NAFIS; editing them
                    here would create a second, quietly diverging copy of data
                    the platform does not own. The counselling record below is
                    the part this team fills in.

                    Fields with no value say so rather than being hidden — for a
                    counsellor "we don't hold this" is information, and hiding
                    empties would make the panel look complete when it is not. */}
                {editingCandidate.nafis && (() => {
                  const n = editingCandidate.nafis;
                  const fields: [string, string, any][] = [
                    ['Gender', 'الجنس', n.gender],
                    ['Age range', 'الفئة العمرية', n.ageGroup],
                    ['Job seeker type', 'نوع الباحث عن عمل', n.jobSeekerType],
                    ['Emirate of residence', 'إمارة الإقامة', n.emirateOfResidence],
                    ['Nationality', 'الجنسية', n.nationality],
                    ['Education', 'المؤهل', n.educationLevel],
                    ['Specialisation', 'التخصص', n.specialization],
                    ['Sub-specialisation', 'التخصص الفرعي', n.subSpecialization],
                    ['GPA', 'المعدل', n.gpa],
                    ['Currently studying', 'يدرس حالياً', n.isStudent],
                    ['Military status', 'الحالة العسكرية', n.militaryStatus],
                    ['Marital status', 'الحالة الاجتماعية', n.maritalStatus],
                    ['Person of determination', 'من أصحاب الهمم', n.personOfDetermination],
                    ['Determination type', 'نوع الإعاقة', n.determinationType],
                  ];
                  const shown = (v: any) =>
                    v === true ? t('Yes', 'نعم')
                      : v === false ? t('No', 'لا')
                      : (v === null || v === undefined || v === '') ? null : String(v);
                  const known = fields.filter(([, , v]) => shown(v) !== null).length;
                  return (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-800">
                          {t('NAFIS record', 'بيانات نافس')}
                        </h4>
                        <span className="text-xs text-slate-500">
                          {t(`${known} of ${fields.length} fields recorded · read-only`,
                             `${known} من ${fields.length} حقلاً مسجّلة · للقراءة فقط`)}
                        </span>
                      </div>
                      <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                        {fields.map(([en, ar, v]) => (
                          <div key={en} className="min-w-0">
                            <p className="text-[11px] text-slate-500">{t(en, ar)}</p>
                            <p className={`truncate text-sm ${shown(v) ? 'text-slate-900' : 'text-slate-400'}`}>
                              {shown(v) ?? t('Not recorded', 'غير مسجّل')}
                            </p>
                          </div>
                        ))}
                      </div>
                      {n.addedAt && (
                        /* Deliberately NOT called a registration date: the import
                           does not carry when they registered with NAFIS, and
                           labelling an import timestamp as one would be a
                           plausible-looking lie. */
                        <p className="text-[11px] text-slate-500">
                          {t('Added to this platform on ', 'أُضيف إلى المنصة في ')}
                          {new Date(n.addedAt).toLocaleDateString(isRTL ? 'ar-AE' : 'en-GB',
                            { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  );
                })()}

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
                    <Select
                      value={editForm.cvStatus || '__none__'}
                      onValueChange={(val) => setEditForm({...editForm, cvStatus: val === '__none__' ? '' : val})}
                    >
                      <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-11">
                        <SelectValue placeholder={t('Not recorded', 'غير مسجّل')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">{t('Not recorded', 'غير مسجّل')}</SelectItem>
                        {CV_STATUS_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        {/* An existing value we do not recognise stays selectable rather
                            than being silently replaced when the form is saved. */}
                        {editForm.cvStatus && !CV_STATUS_OPTIONS.includes(editForm.cvStatus as any) && (
                          <SelectItem value={editForm.cvStatus}>{editForm.cvStatus}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* New Counseling Fields */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{t('Preferred Locations', 'مواقع العمل المفضلة')}</label>
                    {/* Was a comma-separated text box that split on ',' — so a stray
                        comma or a trailing space created values no filter could group.
                        The field is a jsonb array, so a multi-select fits it directly. */}
                    <div className="flex flex-wrap gap-1.5">
                      {[...LOCATION_OPTIONS,
                        // keep anything already stored that is not in the canonical list
                        ...(editForm.preferredLocations || []).filter(
                          (l: string) => l && !LOCATION_OPTIONS.includes(l as any))
                      ].map((loc: string) => {
                        const on = (editForm.preferredLocations || []).includes(loc);
                        return (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setEditForm({
                              ...editForm,
                              preferredLocations: on
                                ? (editForm.preferredLocations || []).filter((x: string) => x !== loc)
                                : [...(editForm.preferredLocations || []), loc],
                            })}
                            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                              on ? 'border-ehrdc-teal bg-ehrdc-teal text-white'
                                 : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                          >
                            {loc}
                          </button>
                        );
                      })}
                    </div>
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
