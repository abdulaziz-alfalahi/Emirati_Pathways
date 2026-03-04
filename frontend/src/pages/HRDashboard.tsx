import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { restClient } from '@/utils/api';
import { TeamManagementTab } from '@/components/hr/TeamManagementTab';
import { ApprovalWorkflow } from '@/components/hr/ApprovalWorkflow';
import { Checkbox } from "@/components/ui/checkbox";
import RecruiterInterviews from '@/components/recruiter/Interviews';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import Messages from '@/components/recruiter/Messages'; // Reuse recruiter messages component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import {
  Users,
  FileText,
  Briefcase,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  UserCheck,
  Building,
  Award,
  MessageSquare,
  Download,
  Upload,
  BarChart3,
  PieChart,
  Target,
  Star,
  Settings,
  Bell,
  Plus,
  Edit,
  Trash2,
  Mail,
  MapPin,
  BrainCircuit
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner"; // Assuming sonner is available, or use alert/console for now if not confirmed
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUnreadMessageCount } from '@/hooks/useUnreadMessageCount';
import { useLanguage } from '@/context/EnhancedLanguageContext';

interface DashboardData {
  candidates: {
    total: number;
    active: number;
    shortlisted: number;
    interviewed: number;
    hired: number;
  };
  positions: {
    total: number;
    open: number;
    filled: number;
    pending: number;
  };
  recruitment: {
    averageTimeToHire: number;
    successRate: number;
    candidateQuality: number;
  };
  activity: Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
}

// Role Switcher Button Component


const HRDashboard: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const b = (en: string, ar: string) => isRTL ? ar : en;
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [shortlistedCandidates, setShortlistedCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<'message' | 'interview' | 'analyze' | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTitle, setInterviewTitle] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const { unreadCount } = useUnreadMessageCount();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Team Member Selection for Interviews
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  // Get user data from localStorage for proper data isolation
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : {};
    } catch {
      return {};
    }
  };

  const userData = getUserData();
  const COMPANY_ID = userData.company_id || userData.profile_data?.companyId || '';
  const HR_MANAGER_ID = userData.id ? String(userData.id) : '';
  const HR_MANAGER_NAME = userData.full_name || userData.first_name || 'HR Manager';

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await restClient.get('/api/hr/approvals/stats');
        if (response.data?.success) {
          setPendingApprovalsCount(response.data.data.pending || 0);
        }
      } catch (error) {
        console.error("Failed to fetch notification stats", error);
      }
    };
    fetchNotifications();
    // Poll every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005';
        const response = await restClient.get(`/api/company/team/members?company_id=${COMPANY_ID}`);
        if (response.data.success) {
          setTeamMembers(response.data.members);
        }
      } catch (error) {
        console.error("Failed to fetch team members", error);
      }
    };

    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005';
        const response = await restClient.get(`/api/hr/jobs?limit=5`);
        if (response.data.success) {
          setActiveJobs(response.data.jobs || []);
        }
      } catch (error) {
        console.error("Failed to fetch jobs", error);
      }
    };

    fetchTeamMembers();
    fetchJobs();
  }, []);

  // Function to switch tabs programmatically if needed
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleAttendeeToggle = (userId: string) => {
    setSelectedAttendees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handlers
  const handleRemoveCandidate = async (jobId: string, candidateId: string) => {
    if (!confirm('Are you sure you want to remove this candidate from the shortlist?')) return;
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005';
      await restClient.delete(`/api/hr/jobs/${jobId}/shortlist/${candidateId}`);
      // Refresh list
      setShortlistedCandidates(prev => prev.filter(c => c.candidate_id !== candidateId));
      alert('Candidate removed from shortlist');
    } catch (error) {
      console.error("Failed to remove candidate", error);
      alert('Failed to remove candidate');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005';
      const response = await restClient.delete(`/api/recruiter/jd/${jobId}`);

      if (response.data.success) {
        setActiveJobs(prev => prev.filter(job => job.id !== jobId));
      } else {
        alert("Failed to delete job: " + (response.data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Failed to delete job", error);
      alert("An error occurred while deleting the job.");
    }
  };

  const handleSendMessage = async () => {
    if (!selectedCandidate || !messageContent) return;
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005';
      await restClient.post(`/api/communication/messages`, {
        recipient_id: selectedCandidate.candidate_id,
        content: messageContent,
        message_type: 'text'
      });
      alert('Message sent successfully');
      setActiveModal(null);
      setMessageContent('');
    } catch (error) {
      console.error("Failed to send message", error);
      alert('Failed to send message');
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedCandidate || !interviewDate || !interviewTitle) return;
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005';

      // Look up application_id if available, otherwise might fail if strict
      // For now we assume we have enough context or backend handles it loosely
      await restClient.post(`/api/interviews/sessions`, {
        candidate_id: selectedCandidate.candidate_id,
        scheduled_at: new Date(interviewDate).toISOString(),
        title: interviewTitle,
        application_id: selectedCandidate.application_id, // Ensure backend provides this in shortlist view
        attendees: selectedAttendees // Pass attendees
      });
      alert('Interview scheduled successfully');
      setActiveModal(null);
      setInterviewDate('');
      setInterviewTitle('');
      setSelectedAttendees([]); // Reset
    } catch (error) {
      console.error("Failed to schedule interview", error);
      alert('Failed to schedule interview');
    }
  };

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    candidates: {
      total: 0,
      active: 0,
      shortlisted: 0,
      interviewed: 0,
      hired: 0
    },
    positions: {
      total: 0,
      open: 0,
      filled: 0,
      pending: 0
    },
    recruitment: {
      averageTimeToHire: 0,
      successRate: 0,
      candidateQuality: 0
    },
    activity: []
  });

  // Fetch real data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('access_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005';
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Metrics
      try {
        const metricsResponse = await restClient.get(`/api/hr/dashboard/metrics`, { headers });
        if (metricsResponse.data.success) {
          const m = metricsResponse.data.metrics;
          setDashboardData(prev => ({
            ...prev,
            candidates: {
              ...prev.candidates,
              total: m.overview.total_applications,
              active: m.overview.new_applications,
              interviewed: m.overview.interviews_scheduled,
              hired: m.overview.positions_filled
            },
            positions: {
              ...prev.positions,
              open: m.overview.active_jobs,
              total: m.overview.total_jobs,
              filled: m.overview.positions_filled
            },
            recruitment: {
              averageTimeToHire: m.performance.avg_time_to_hire,
              successRate: m.performance.success_rate,
              candidateQuality: 0
            }
          }));
        }
      } catch (error) {
        console.error("Failed to fetch metrics", error);
        // Do not set global mock data here, potentially partial failure
      }

      // 2. Fetch Jobs (Positions)
      try {
        await restClient.get(`/api/hr/jobs`, { headers });
      } catch (error) {
        console.error("Failed to fetch jobs", error);
      }

      // 3. Fetch Shortlisted Candidates
      try {
        const shortlistResponse = await restClient.get(`/api/hr/jobs/shortlisted-candidates`, { headers });
        if (shortlistResponse.data.success) {
          console.log("Shortlist loaded:", shortlistResponse.data.data.length);
          setShortlistedCandidates(shortlistResponse.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch shortlisted candidates", error);
      }
    };

    fetchDashboardData();
  }, []);

  const setMockData = () => {
    // Legacy mock data setting - keep for fallback if needed elsewhere
    // but default state handles dashboard structure
    setDashboardData(prev => ({
      ...prev,
      candidates: { ...prev.candidates, total: 156, shortlisted: 23 },
      recruitment: { ...prev.recruitment, successRate: 72 }
    }));
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 font-dubai ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <HybridGovernmentNavFixed showAuthButtons={true} currentLanguage={language} onLanguageToggle={toggleLanguage} />



      {/* Main Content */}
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <div>
                <h1 className="text-3xl font-dubai-bold text-slate-900 mb-2">
                  {b('HR Management Dashboard', 'لوحة إدارة الموارد البشرية')}
                </h1>
                <p className="text-slate-600 font-dubai-medium">
                  {b(`Welcome back, ${HR_MANAGER_NAME} - Manage UAE National talent acquisition`, `مرحباً بعودتك، ${HR_MANAGER_NAME} - إدارة استقطاب المواهب الوطنية`)}
                </p>
              </div>
              <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-dubai-medium">
                  {b('HR Manager', 'مدير الموارد البشرية')}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-dubai-medium">
                  {b('Talent33 Aligned', 'متوافق مع برنامج نافس')}
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {b('Settings', 'الإعدادات')}
                </Button>

              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium"
                onClick={() => navigate('/recruiter/jd-builder')}
              >
                <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {b('Post New Job', 'نشر وظيفة جديدة')}
              </Button>
              <Button
                variant="outline"
                className="font-dubai-medium"
                onClick={() => navigate('/recruiter/candidates')}
              >
                <Upload className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {b('Import Candidates', 'استيراد المرشحين')}
              </Button>
              <Button
                variant="outline"
                className="font-dubai-medium"
                onClick={() => navigate('/recruiter/analytics')}
              >
                <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {b('Export Reports', 'تصدير التقارير')}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-8 bg-white shadow-sm" dir={isRTL ? 'rtl' : 'ltr'}>
              <TabsTrigger value="overview" className="font-dubai-medium">{b('Overview', 'نظرة عامة')}</TabsTrigger>
              <TabsTrigger value="approvals" className="font-dubai-medium">{b('Approvals', 'الموافقات')}</TabsTrigger>
              <TabsTrigger value="team" className="font-dubai-medium">{b('Team', 'الفريق')}</TabsTrigger>
              <TabsTrigger value="candidates" className="font-dubai-medium">{b('Candidates', 'المرشحون')}</TabsTrigger>
              <TabsTrigger value="interviews" className="font-dubai-medium">{b('Interviews', 'المقابلات')}</TabsTrigger>
              <TabsTrigger value="positions" className="font-dubai-medium">{b('Positions', 'الوظائف')}</TabsTrigger>
              <TabsTrigger value="messages" className="font-dubai-medium">
                {b('Messages', 'الرسائل')}
                {unreadCount > 0 && (
                  <span className={`${isRTL ? 'mr-1.5' : 'ml-1.5'} inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px]`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="font-dubai-medium">{b('Analytics', 'التحليلات')}</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: b('Total Candidates', 'إجمالي المرشحين'), value: dashboardData.candidates.total, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', trend: b('+12% from last month', '+١٢٪ عن الشهر الماضي') },
                  { label: b('Open Positions', 'الوظائف المفتوحة'), value: dashboardData.positions.open, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', trend: b(`${dashboardData.positions.pending} pending`, `${dashboardData.positions.pending} قيد الانتظار`) },
                  { label: b('Avg. Time to Hire', 'متوسط وقت التوظيف'), value: `${dashboardData.recruitment.averageTimeToHire}${b('d', 'ي')}`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', trend: b('-5 days from Q3', '-٥ أيام عن الربع الثالث') },
                  { label: b('Success Rate', 'معدل النجاح'), value: `${dashboardData.recruitment.successRate}%`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', trend: b('+8% from Q3', '+٨٪ عن الربع الثالث') },
                ].map((stat, i) => (
                  <Card key={i} className={`bg-white border ${stat.border} hover:shadow-md transition-all duration-200 group`}>
                    <CardContent className="pt-5 pb-4 px-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 font-dubai-medium">{stat.label}</p>
                          <p className="text-3xl font-dubai-bold text-slate-900">{stat.value}</p>
                          <p className="text-xs text-green-600 font-dubai-medium mt-0.5">{stat.trend}</p>
                        </div>
                        <div className={`p-3 ${stat.bg} rounded-xl group-hover:scale-110 transition-transform`}>
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 3-Column: Emiratization Gauge + Pipeline + Compliance Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Emiratization Compliance Gauge */}
                <Card className="bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold">
                      <Target className="h-4 w-4 text-teal-600" />
                      {b('Emiratization Compliance', 'الامتثال للتوطين')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 flex flex-col items-center">
                    {/* SVG Circular Gauge */}
                    <div className="relative">
                      <svg width={140} height={140} className="transform -rotate-90">
                        <circle cx={70} cy={70} r={55} fill="none" stroke="#E5E7EB" strokeWidth={12} />
                        <circle cx={70} cy={70} r={55} fill="none" stroke="#006E6D" strokeWidth={12}
                          strokeDasharray={`${2 * Math.PI * 55}`}
                          strokeDashoffset={`${2 * Math.PI * 55 - (78 / 100) * 2 * Math.PI * 55}`}
                          strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                        <text x={70} y={70} textAnchor="middle" dominantBaseline="central"
                          className="fill-slate-900 text-2xl font-bold" transform={`rotate(90, 70, 70)`}>
                          78%
                        </text>
                      </svg>
                    </div>
                    <span className="text-xs text-slate-500 mt-2 text-center font-dubai-medium">{b('Current Emiratization Rate', 'معدل التوطين الحالي')}</span>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">{b('Target: 80%', 'الهدف: ٨٠٪')}</Badge>
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">{b('+3% this quarter', '+٣٪ هذا الربع')}</Badge>
                    </div>
                    <Button variant="link" size="sm" className="text-xs text-teal-600 mt-3 font-dubai-medium">
                      {b('View Detailed Report →', 'عرض التقرير المفصل ←')}
                    </Button>
                  </CardContent>
                </Card>

                {/* Hiring Pipeline Funnel */}
                <Card className="bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold">
                      <BarChart3 className="h-4 w-4 text-teal-600" />
                      {b('Hiring Pipeline', 'مسار التوظيف')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <div className="space-y-4">
                      {[
                        { stage: b('Total Candidates', 'إجمالي المرشحين'), count: dashboardData.candidates.total || 156, color: 'bg-gradient-to-r from-teal-400 to-teal-500', pct: 100 },
                        { stage: b('Screening', 'الفرز'), count: dashboardData.candidates.active || 89, color: 'bg-gradient-to-r from-teal-500 to-teal-600', pct: 57 },
                        { stage: b('Shortlisted', 'القائمة المختصرة'), count: dashboardData.candidates.shortlisted || 23, color: 'bg-gradient-to-r from-teal-600 to-teal-700', pct: 15 },
                        { stage: b('Interviewed', 'تمت المقابلة'), count: dashboardData.candidates.interviewed || 12, color: 'bg-gradient-to-r from-teal-700 to-teal-800', pct: 8 },
                        { stage: b('Hired', 'تم التوظيف'), count: dashboardData.candidates.hired || 5, color: 'bg-gradient-to-r from-slate-700 to-slate-800', pct: 3 },
                      ].map((ps, i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider font-dubai-medium">{ps.stage}</span>
                            <span className="text-sm font-bold text-slate-700 font-dubai-bold">{ps.count}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${ps.color}`}
                              style={{ width: `${Math.max(ps.pct, 5)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Alerts + Quick Actions */}
                <div className="space-y-6">
                  {/* Compliance Alerts */}
                  <Card className="bg-white border border-red-100">
                    <CardHeader className="pb-2 border-b border-red-50 bg-red-50/30">
                      <CardTitle className="flex items-center gap-2 text-base text-red-800 font-dubai-bold">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        {b('Compliance Alerts', 'تنبيهات الامتثال')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3 space-y-3">
                      <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                        <p className="text-sm font-dubai-medium text-red-800">{b('MOHRE Deadline', 'موعد وزارة الموارد البشرية')}</p>
                        <p className="text-xs text-red-600 mt-0.5">{b('Emiratization report due in 12 days', 'تقرير التوطين مستحق خلال ١٢ يوماً')}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                        <p className="text-sm font-dubai-medium text-amber-800">{b('Quota Target', 'هدف الحصة')}</p>
                        <p className="text-xs text-amber-600 mt-0.5">{b('2% gap to achieve 80% target by Q4', 'فجوة ٢٪ لتحقيق هدف ٨٠٪ بحلول الربع الرابع')}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold">
                        <Settings className="h-4 w-4 text-teal-600" />
                        {b('Quick Actions', 'إجراءات سريعة')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3 space-y-2">
                      <Button variant="outline" className={`w-full ${isRTL ? 'justify-end flex-row-reverse' : 'justify-start'} text-sm h-10 font-dubai-medium hover:bg-teal-50 hover:text-teal-700`}
                        onClick={() => navigate('/recruiter/analytics')}>
                        <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-teal-600`} />
                        {b('Generate Report', 'إنشاء تقرير')}
                      </Button>
                      <Button variant="outline" className={`w-full ${isRTL ? 'justify-end flex-row-reverse' : 'justify-start'} text-sm h-10 font-dubai-medium hover:bg-teal-50 hover:text-teal-700`}
                        onClick={() => navigate('/recruiter/jd-builder')}>
                        <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-500`} />
                        {b('Request Headcount', 'طلب عدد موظفين')}
                      </Button>
                      <Button variant="outline" className={`w-full ${isRTL ? 'justify-end flex-row-reverse' : 'justify-start'} text-sm h-10 font-dubai-medium hover:bg-teal-50 hover:text-teal-700`}>
                        <Building className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-purple-500`} />
                        {b('View MOHRE Portal', 'عرض بوابة الوزارة')}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Workforce Composition + Recent Hires */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Workforce Composition */}
                <Card className="bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold">
                      <PieChart className="h-4 w-4 text-teal-600" />
                      {b('Workforce Composition', 'تكوين القوى العاملة')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-8">
                      {/* Simple bar chart representation */}
                      <div className="flex-1 space-y-3">
                        {[
                          { label: b('UAE Nationals', 'مواطنون إماراتيون'), value: 78, color: 'bg-teal-500' },
                          { label: b('GCC Nationals', 'مواطنون خليجيون'), value: 12, color: 'bg-blue-500' },
                          { label: b('International', 'دوليون'), value: 10, color: 'bg-slate-400' },
                        ].map((item, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-dubai-medium text-slate-600">{item.label}</span>
                              <span className="text-xs font-dubai-bold text-slate-800">{item.value}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                              <div className={`h-full rounded-full ${item.color} transition-all duration-1000`}
                                style={{ width: `${item.value}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-dubai-bold text-teal-700">342</div>
                        <div className="text-xs text-slate-500 font-dubai-medium">{b('Total Employees', 'إجمالي الموظفين')}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Hires */}
                <Card className="bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold">
                        <UserCheck className="h-4 w-4 text-teal-600" />
                        {b('Recent Hires', 'التعيينات الأخيرة')}
                      </CardTitle>
                      <Badge className="bg-teal-50 text-teal-700 border-teal-200 text-[10px]">
                        {dashboardData.candidates.hired || 5} {b('this month', 'هذا الشهر')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-3">
                    {[
                      { name: b('Fatima Al Nuaimi', 'فاطمة النعيمي'), role: b('Senior Data Analyst', 'محللة بيانات أولى'), dept: b('Technology', 'التكنولوجيا'), initials: isRTL ? 'فن' : 'FN', bg: 'bg-teal-100 text-teal-700' },
                      { name: b('Ahmed Al Dhaheri', 'أحمد الظاهري'), role: b('Marketing Manager', 'مدير التسويق'), dept: b('Marketing', 'التسويق'), initials: isRTL ? 'أظ' : 'AD', bg: 'bg-indigo-100 text-indigo-700' },
                      { name: b('Mariam Al Suwaidi', 'مريم السويدي'), role: b('HR Coordinator', 'منسقة موارد بشرية'), dept: b('Human Resources', 'الموارد البشرية'), initials: isRTL ? 'مس' : 'MS', bg: 'bg-purple-100 text-purple-700' },
                    ].map((hire, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${hire.bg}`}>
                          {hire.initials}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-dubai-medium text-slate-800">{hire.name}</p>
                          <p className="text-xs text-slate-400 font-dubai">{hire.role} • {hire.dept}</p>
                        </div>
                        <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">{b('Onboarded', 'تم التعيين')}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-white border border-slate-200/80">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="font-dubai-bold text-slate-900 text-base">{b('Recent Activity', 'النشاط الأخير')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="space-y-2">
                    {dashboardData.activity.length > 0 ? (
                      dashboardData.activity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex-shrink-0">
                            {activity.type === 'candidate_hired' && <CheckCircle className="h-4 w-4 text-green-500 mt-1" />}
                            {activity.type === 'interview_scheduled' && <Calendar className="h-4 w-4 text-blue-500 mt-1" />}
                            {activity.type === 'application_received' && <FileText className="h-4 w-4 text-purple-500 mt-1" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-dubai-medium text-slate-800">{activity.title}</p>
                            <p className="text-xs text-slate-500 font-dubai">{activity.description}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-dubai">
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 font-dubai-medium py-4 text-center">{b('No recent activity', 'لا يوجد نشاط حديث')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Approvals Tab */}
            <TabsContent value="approvals" className="space-y-6">
              <ApprovalWorkflow
                companyId={COMPANY_ID}
                hrManagerId={HR_MANAGER_ID}
              />
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <Messages />
            </TabsContent>

            {/* Candidates Tab */}
            <TabsContent value="candidates" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">{b('Candidate Management', 'إدارة المرشحين')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    {b('Manage and review candidate applications', 'إدارة ومراجعة طلبات المرشحين')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex-1">
                      <Input placeholder="Search candidates..." className="max-w-sm font-dubai" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-[180px] font-dubai">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Candidates</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="interviewed">Interviewed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button className="font-dubai-medium">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>

                  <div className="rounded-md border mb-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Candidate</TableHead>
                          <TableHead>Job Position</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shortlistedCandidates.length > 0 ? (
                          shortlistedCandidates.map((candidate: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                <div>
                                  <div className="font-dubai-bold">{candidate.first_name} {candidate.last_name}</div>
                                  <div className="text-sm text-slate-500">{candidate.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>{candidate.job_title}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  Shortlisted
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="ghost" title="Message" onClick={() => { setSelectedCandidate(candidate); setActiveModal('message'); }}>
                                    <MessageSquare className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button size="sm" variant="ghost" title="Schedule Interview" onClick={() => { setSelectedCandidate(candidate); setActiveModal('interview'); }}>
                                    <Calendar className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button size="sm" variant="ghost" title="AI Analysis" onClick={() => { setSelectedCandidate(candidate); setActiveModal('analyze'); }}>
                                    <BrainCircuit className="h-4 w-4 text-purple-600" />
                                  </Button>
                                  <Button size="sm" variant="ghost" title="Remove" onClick={() => handleRemoveCandidate(candidate.job_posting_id, candidate.candidate_id)}>
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                              No candidates shortlisted yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Modals */}
                  <Dialog open={activeModal === 'message'} onOpenChange={() => setActiveModal(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Message Candidate</DialogTitle>
                        <DialogDescription>Send a direct message to {selectedCandidate?.first_name} {selectedCandidate?.last_name}.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <Textarea placeholder="Type your message here..." value={messageContent} onChange={(e) => setMessageContent(e.target.value)} />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                        <Button onClick={handleSendMessage}>Send Message</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={activeModal === 'interview'} onOpenChange={() => setActiveModal(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule Interview</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="title">Interview Title</Label>
                          <Input id="title" value={interviewTitle} onChange={(e) => setInterviewTitle(e.target.value)} placeholder="e.g., Initial Screening" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="date">Date & Time</Label>
                          <Input id="date" type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Invite Team Members (Optional)</Label>
                          <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                            {teamMembers.length === 0 ? (
                              <p className="text-sm text-slate-500">No team members found.</p>
                            ) : (
                              teamMembers.map(member => (
                                <div key={member.user_id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`invite-${member.user_id}`}
                                    checked={selectedAttendees.includes(member.user_id)}
                                    onCheckedChange={() => handleAttendeeToggle(member.user_id)}
                                  />
                                  <label
                                    htmlFor={`invite-${member.user_id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {member.full_name} <span className="text-xs text-slate-400">({member.role})</span>
                                  </label>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                        <Button onClick={handleScheduleInterview}>Schedule</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={activeModal === 'analyze'} onOpenChange={() => setActiveModal(null)}>
                    <DialogContent className="max-w-4xl h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>AI Candidate Analysis</DialogTitle>
                        <DialogDescription>Comprehensive profile analysis for {selectedCandidate?.first_name} {selectedCandidate?.last_name}</DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-full pr-4">
                        <div className="space-y-6">
                          {/* 1. CV Analysis */}
                          <section>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                              <FileText className="h-5 w-5 text-blue-500" /> CV Insights
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-lg border">
                              <p className="text-sm text-slate-600 mb-2"><strong>Match Score:</strong> 85% (High match for current Role)</p>
                              <p className="text-sm text-slate-600">Strong experience in required technologies. Education aligns with requirements.</p>
                            </div>
                          </section>

                          {/* 2. Portfolio */}
                          <section>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                              <Briefcase className="h-5 w-5 text-purple-500" /> Portfolio & Projects
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-lg border text-sm text-slate-600">
                              <ul className="list-disc pl-5 space-y-1">
                                <li><strong>E-commerce Platform:</strong> Lead developer for a scalable React/Node app.</li>
                                <li><strong>AI Chatbot:</strong> Implemented RAG pipeline using Python/LangChain.</li>
                              </ul>
                            </div>
                          </section>

                          {/* 3. Assessments */}
                          <section>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                              <BrainCircuit className="h-5 w-5 text-teal-500" /> Assessments
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 p-3 rounded border text-center">
                                <div className="text-2xl font-bold text-teal-600">120</div>
                                <div className="text-xs uppercase text-slate-500">IQ Score</div>
                              </div>
                              <div className="bg-slate-50 p-3 rounded border text-center">
                                <div className="text-2xl font-bold text-teal-600">High</div>
                                <div className="text-xs uppercase text-slate-500">EQ Level</div>
                              </div>
                              <div className="bg-slate-50 p-3 rounded border text-center">
                                <div className="text-2xl font-bold text-teal-600">8/10</div>
                                <div className="text-xs uppercase text-slate-500">Technical (Python)</div>
                              </div>
                              <div className="bg-slate-50 p-3 rounded border text-center">
                                <div className="text-2xl font-bold text-teal-600">ENTJ</div>
                                <div className="text-xs uppercase text-slate-500">Personality</div>
                              </div>
                            </div>
                          </section>

                          {/* 4. Credentials */}
                          <section>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                              <Award className="h-5 w-5 text-yellow-500" /> Official Credentials
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-lg border text-sm">
                              <div className="flex items-center gap-2 text-green-700 mb-1">
                                <CheckCircle className="h-4 w-4" /> Verified University Degree (MSc Computer Science)
                              </div>
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="h-4 w-4" /> UAE Golden Visa Eligible
                              </div>
                            </div>
                          </section>

                          {/* 5. Feedback */}
                          <section>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                              <MessageSquare className="h-5 w-5 text-orange-500" /> Interview Feedback
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-lg border">
                              <p className="text-sm italic text-slate-600">"Candidate showed excellent problem-solving skills during the technical screen. Good cultural fit." - Senior Dev</p>
                            </div>
                          </section>
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>


                  <div className="text-center">
                    <Button
                      className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium"
                      onClick={() => navigate('/recruiter/candidates')}
                    >
                      View All Candidates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interviews" className="space-y-6">
              <RecruiterInterviews />
            </TabsContent>

            {/* Positions Tab */}
            <TabsContent value="positions" className="space-y-6">
              <Card className="bg-white shadow-sm">

                <CardContent>
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h2 className="text-xl font-dubai-bold mb-1">Position Management</h2>
                      <p className="text-slate-500 font-dubai-medium">Manage job positions and requirements</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="bg-ehrdc-teal hover:bg-ehrdc-dark-teal text-white flex items-center gap-2"
                        onClick={() => navigate('/recruiter/jd-builder')}
                      >
                        <Plus className="h-4 w-4" />
                        Create New Position
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3 mb-8">
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-dubai-bold text-green-800">Open Positions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-dubai-bold text-green-600">
                          {activeJobs.filter(j => j.status === 'published' || j.status === 'active').length}
                        </div>
                        <p className="text-sm text-green-700 font-dubai-medium">Currently recruiting</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-dubai-bold text-blue-800">Filled Positions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-dubai-bold text-blue-600">{dashboardData.positions.filled}</div>
                        <p className="text-sm text-blue-700 font-dubai-medium">Successfully filled</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-orange-50 border-orange-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-dubai-bold text-orange-800">Pending Approval</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-dubai-bold text-orange-600">{activeJobs.filter(j => j.status === 'draft').length}</div>
                        <p className="text-sm text-orange-700 font-dubai-medium">Drafts & Awaiting approval</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Active Job Postings List */}
                  {activeJobs.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-dubai-bold text-slate-900 mb-4">Active Job Postings</h3>
                      <div className="rounded-md border shadow-sm">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Job Details</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Requirements</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeJobs.map((job) => (
                              <TableRow key={job.id}>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="font-medium font-dubai-bold">{job.title || 'Untitled Job'}</div>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 font-dubai-medium">
                                      <div className="flex items-center gap-1">
                                        <Building className="h-3 w-3" />
                                        {job.company_name || 'Unknown Company'}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {job.location || 'Location TBD'}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Briefcase className="h-3 w-3" />
                                        {job.employment_type || 'Full-time'}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={
                                    job.status === 'active' || job.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' :
                                      job.status === 'draft' ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-700'
                                  }>
                                    {job.status || 'draft'}
                                  </Badge>
                                  <div className="text-xs text-slate-500 mt-1 font-dubai">
                                    {job.created_at ? new Date(job.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm space-y-1 font-dubai-medium text-slate-600">
                                    <div>Requirements: {Array.isArray(job.requirements) ? job.requirements.length : 0}</div>
                                    <div>Responsibilities: {Array.isArray(job.responsibilities) ? job.responsibilities.length : 0}</div>
                                    <div>Benefits: {Array.isArray(job.benefits) ? job.benefits.length : 0}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" className="text-teal-600 border-teal-200 hover:bg-teal-50" onClick={() => navigate(`/recruiter/jd-builder?id=${job.id}`)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDeleteJob(job.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {activeJobs.length >= 5 && (
                        <div className="mt-4 text-center">
                          <Button
                            variant="link"
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem('access_token');
                                const headers = { Authorization: `Bearer ${token}` };
                                const response = await restClient.get(`/api/hr/jobs?limit=50`, { headers });
                                if (response.data.success) {
                                  setActiveJobs(response.data.jobs || []);
                                  // Hide button by strictly checking if we have more active jobs (optional logic, but for now simple)
                                }
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                          >
                            View All Positions ({dashboardData.positions.open} active)
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Recruitment Analytics</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Insights and metrics for data-driven decisions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Advanced Analytics</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Comprehensive recruitment analytics and insights</p>
                    <Button
                      className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium"
                      onClick={() => navigate('/recruiter/analytics')}
                    >
                      View Analytics Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-6">
              <TeamManagementTab />
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div >
  );
};

export default HRDashboard;
