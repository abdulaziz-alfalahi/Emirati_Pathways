import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Phone, Briefcase, FileText, UserPlus, Save, Loader2, RefreshCw, Search, ChevronLeft, ChevronRight, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { restClient } from '@/utils/api';
import { toast } from '@/components/ui/use-toast';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function CareerServicesDashboard() {
  const { language, toggleLanguage } = useLanguage();
  const isRTL = language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  const [candidates, setCandidates] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters and Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [callStatusFilter, setCallStatusFilter] = useState('All');
  const [workStatusFilter, setWorkStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Editing Sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCandidates();
    fetchOperators();
  }, []);

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
            phone: user.phone || '-',
            remarks: profile.counseling_remarks || '',
            assignedTo: profile.assigned_to || 'Unassigned',
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
    });
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!editingCandidate) return;
    setIsSaving(true);
    try {
      const payload = {
        ...editForm,
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
  const filteredCandidates = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return candidates.filter(c => {
      const candidateName = c.name ? String(c.name) : '';
      const candidateEid = c.eid ? String(c.eid) : '';
      
      const cleanName = candidateName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanEid = candidateEid.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const matchesSearch = !cleanSearch || 
                            cleanName.includes(cleanSearch) || 
                            cleanEid.includes(cleanSearch);
      const matchesCallStatus = callStatusFilter === 'All' || c.callStatus === callStatusFilter;
      const matchesWorkStatus = workStatusFilter === 'All' || c.workStatus === workStatusFilter;
      return matchesSearch && matchesCallStatus && matchesWorkStatus;
    });
  }, [candidates, searchTerm, callStatusFilter, workStatusFilter]);

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
          <Button onClick={fetchCandidates} variant="outline" className="gap-2 bg-white shadow-sm hover:bg-slate-50 border-slate-200 rounded-xl transition-all">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#006E6D]' : 'text-slate-500'}`} /> 
            {t('Sync Nafis Data', 'مزامنة بيانات نافس')}
          </Button>
        </div>

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
                  placeholder={t('Search by name or EID...', 'ابحث بالاسم أو الهوية...')}
                  className={`ps-10 ${isRTL ? 'pe-3' : ''} bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-[#006E6D]`}
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <div className="flex w-full md:w-auto gap-3">
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
                          <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">{candidate.jobSeekerType}</Badge>
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
                            {candidate.assignedTo !== 'Unassigned' && (
                              <div className="w-6 h-6 rounded-full bg-[#006E6D] text-white flex items-center justify-center text-[10px] font-bold">
                                {getInitials(candidate.assignedTo)}
                              </div>
                            )}
                            <span className={`font-medium ${candidate.assignedTo === 'Unassigned' ? 'text-amber-500' : 'text-slate-700'}`}>
                              {candidate.assignedTo}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-slate-600 truncate" title={candidate.remarks}>
                            {candidate.remarks || <span className="text-slate-400 italic">No remarks yet</span>}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-end">
                          <Button 
                            size="sm" 
                            onClick={() => handleEditClick(candidate)} 
                            className="bg-white text-[#006E6D] border border-[#006E6D]/20 hover:bg-[#F0F7F7] shadow-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
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
      </main>

      {/* Slide-out Edit Drawer */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side={isRTL ? 'left' : 'right'} className="w-full sm:max-w-md p-0 flex flex-col bg-white border-none shadow-2xl">
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
                        {operators.map((op) => (
                          <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
