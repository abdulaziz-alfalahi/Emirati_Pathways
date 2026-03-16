import React, { useState, useEffect } from 'react';
import { getAuthToken } from '@/utils/tokenUtils';
import { getDisplayName } from '@/utils/nameUtils';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  User,
  Briefcase,
  Users,
  Video,
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
  Calendar,
  FileText,
  TrendingUp,
  Activity,
  RotateCcw,
  ChevronRight,
  Plus,
  Sparkles,
  Settings
} from 'lucide-react';

/* ─── Circular Gauge Component ─── */
const CircularGauge: React.FC<{ value: number; size?: number; strokeWidth?: number; color?: string; label?: string }> = ({
  value, size = 130, strokeWidth = 12, color = '#006E6D', label = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
          className="fill-slate-900 text-2xl font-bold" transform={`rotate(90, ${size / 2}, ${size / 2})`}>
          {value}%
        </text>
      </svg>
      {label && <span className="text-xs text-slate-500 mt-1">{label}</span>}
    </div>
  );
};

/* ─── Pipeline Bar Component ─── */
const PipelineBar: React.FC<{ stage: string; count: number; maxCount: number; color: string }> = ({
  stage, count, maxCount, color
}) => {
  const width = maxCount > 0 ? Math.max((count / maxCount) * 100, 5) : 5;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stage}</span>
        <span className="text-sm font-bold text-slate-700">{count}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

// Role Switcher Button Component
const RoleSwitcherButton = () => {
  const handleRoleSwitch = () => {
    console.log('🔄 Switching to role selector from Recruiter Dashboard');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_token');
    window.location.href = '/role_selector.html';
  };

  return (
    <button
      onClick={handleRoleSwitch}
      className="fixed top-5 right-5 z-[1000] flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-600 to-teal-700 text-white text-sm font-semibold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300"
    >
      <RotateCcw size={14} />
      Switch Role
    </button>
  );
};

const RecruiterDashboard = () => {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState({
    jobs: { total: 0, active: 0, filled: 0, pending: 0 },
    candidates: { total: 0, applied: 0, shortlisted: 0, interviewed: 0, hired: 0 },
    interviews: { scheduled: 0, completed: 0, pending: 0 },
    performance: { fillRate: 0, timeToHire: 0, candidateQuality: 0, clientSatisfaction: 0 },
    activity: [] as any[]
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, navigate]);

  const getUserDisplayName = () => getDisplayName(user, 'Recruiter');

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.replace('/auth');
    } catch (error) {
      console.error('Recruiter logout error:', error);
      window.location.href = '/auth';
    }
  };

  const loadDashboardData = async () => {
    try {
      const token = getAuthToken();
      if (!token) { setMockData(); return; }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/recruiter/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data || {});
      } else {
        setMockData();
      }
    } catch (error) {
      console.error('Error loading recruiter dashboard data:', error);
      setMockData();
    }
  };

  const setMockData = () => {
    setDashboardData({
      jobs: { total: 24, active: 12, filled: 8, pending: 4 },
      candidates: { total: 840, applied: 89, shortlisted: 34, interviewed: 18, hired: 12 },
      interviews: { scheduled: 15, completed: 15, pending: 3 },
      performance: { fillRate: 78, timeToHire: 21, candidateQuality: 8.6, clientSatisfaction: 9.2 },
      activity: [
        { id: 1, type: 'candidate_hired', title: 'Candidate Successfully Placed', description: 'Fatima Al Zahra hired as Marketing Manager at Dubai Tourism', timestamp: new Date().toISOString() },
        { id: 2, type: 'interview_scheduled', title: 'Interview Scheduled', description: 'Technical interview for Senior Developer position', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, type: 'job_posted', title: 'New Job Posted', description: 'Data Analyst position posted for Emirates Airlines', timestamp: new Date(Date.now() - 86400000).toISOString() }
      ]
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-slate-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const firstName = getUserDisplayName().split(' ')[0];

  // Stat cards data
  const statCards = [
    { label: 'Active Jobs', value: dashboardData.jobs.active, icon: Briefcase, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', sub: `${dashboardData.jobs.pending} pending` },
    { label: 'Total Candidates', value: dashboardData.candidates.total, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', sub: `${dashboardData.candidates.applied} new` },
    { label: 'Interviews', value: dashboardData.interviews.scheduled, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', sub: 'This week' },
    { label: 'Offers Extended', value: dashboardData.candidates.hired, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', sub: `${dashboardData.performance.fillRate}% fill rate` },
  ];

  // Pipeline data
  const maxPipelineCount = dashboardData.candidates.applied || 90;
  const pipelineStages = [
    { stage: 'Applied', count: dashboardData.candidates.applied || 90, color: 'bg-gradient-to-r from-teal-500 to-teal-400' },
    { stage: 'Screened', count: Math.round((dashboardData.candidates.applied || 90) * 0.72), color: 'bg-gradient-to-r from-teal-600 to-teal-500' },
    { stage: 'Interviewed', count: dashboardData.candidates.interviewed || 18, color: 'bg-gradient-to-r from-teal-700 to-teal-600' },
    { stage: 'Offered', count: Math.round((dashboardData.candidates.hired || 12) * 1.3), color: 'bg-gradient-to-r from-slate-700 to-slate-600' },
    { stage: 'Hired', count: dashboardData.candidates.hired || 12, color: 'bg-gradient-to-r from-slate-800 to-slate-700' },
  ];

  // Mock top AI matches
  const topMatches = [
    { name: 'Ahmed Al Mazrouei', role: 'Cloud Solutions Architect', match: 98, initials: 'AM', bg: 'bg-teal-100 text-teal-700' },
    { name: 'Sara Bin Khalfan', role: 'Data Scientist', match: 95, initials: 'SB', bg: 'bg-indigo-100 text-indigo-700' },
    { name: 'Omar Al Tayer', role: 'Product Manager', match: 96, initials: 'OT', bg: 'bg-purple-100 text-purple-700' },
  ];

  // Mock recent applications
  const recentApplications = [
    { name: 'Hind Al Marzouqi', role: 'Marketing Lead', match: 94, status: 'New', statusColor: 'bg-teal-50 text-teal-700 border-teal-200' },
    { name: 'Saeed Al Gharbi', role: 'Financial Analyst', match: 91, status: 'Under Review', statusColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  ];

  // Mock upcoming interviews
  const upcomingInterviews = [
    { date: '24', month: 'Mar', name: 'Maryam Al Shamsi', role: 'Product Designer', time: '10:30 AM' },
    { date: '25', month: 'Mar', name: 'Khalid Al Qasimi', role: 'QA Engineer', time: '02:00 PM' },
  ];

  return (
    <Layout>
      <RoleSwitcherButton />

      <div className="min-h-screen bg-[#FAFBFC]">
        {/* ─── Enhanced Header ─── */}
        <div className="bg-white border-b border-slate-200/80">
          <div className="container mx-auto px-4 py-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {firstName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-900">
                      Welcome back, {firstName}
                    </h1>
                    <Badge className="bg-teal-50 text-teal-700 border border-teal-200 text-xs font-medium">
                      HR Manager
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="text-slate-600 border-slate-200" onClick={() => navigate('/recruiter/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white" size="sm" onClick={() => navigate('/recruiter/post-job')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200/80">
              <TabsTrigger value="overview" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm">
                <User className="h-4 w-4 mr-2" /> Overview
              </TabsTrigger>
              <TabsTrigger value="jobs" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm">
                <Briefcase className="h-4 w-4 mr-2" /> Jobs
              </TabsTrigger>
              <TabsTrigger value="candidates" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm">
                <Users className="h-4 w-4 mr-2" /> Candidates
              </TabsTrigger>
              <TabsTrigger value="interviews" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm">
                <Video className="h-4 w-4 mr-2" /> Interviews
              </TabsTrigger>
            </TabsList>

            {/* ════════════════════════════════════════════════════════════
                              ENHANCED OVERVIEW TAB
               ════════════════════════════════════════════════════════════ */}
            <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* ─── Stat Cards ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                  <Card key={i} className={`bg-white border ${stat.border} hover:shadow-md transition-all duration-200 group`}>
                    <CardContent className="pt-5 pb-4 px-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                          <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
                        </div>
                        <div className={`p-3 ${stat.bg} rounded-xl group-hover:scale-110 transition-transform`}>
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ─── Pipeline + Compliance Row ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hiring Pipeline — 2 cols */}
                <Card className="lg:col-span-2 bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                        <BarChart3 className="h-4 w-4 text-teal-600" />
                        Hiring Pipeline
                      </CardTitle>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-[150px] h-8 text-xs border-slate-200">
                          <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          <SelectItem value="tech">Technology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <div className="space-y-4">
                      {pipelineStages.map((ps, i) => (
                        <PipelineBar key={i} stage={ps.stage} count={ps.count} maxCount={maxPipelineCount} color={ps.color} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance + Top Matches — 1 col */}
                <div className="space-y-6">
                  {/* Emiratization Compliance Gauge */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                        <Target className="h-4 w-4 text-teal-600" />
                        Compliance Gauge
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 flex flex-col items-center">
                      <CircularGauge value={dashboardData.performance.fillRate || 78} label="Emiratization Compliance Rate" />
                      <Button variant="link" size="sm" className="text-xs text-teal-600 mt-2">
                        View Detailed Report →
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Top AI Matches */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                          <Sparkles className="h-4 w-4 text-teal-600" />
                          Top AI Matches
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="space-y-3">
                        {topMatches.map((m, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${m.bg}`}>
                                {m.initials}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800 group-hover:text-teal-700">{m.name}</p>
                                <p className="text-xs text-slate-400">{m.role}</p>
                              </div>
                            </div>
                            <Badge className="bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold">
                              {m.match}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* ─── Recent Applications + Upcoming Interviews ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Applications */}
                <Card className="bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                        <FileText className="h-4 w-4 text-teal-600" />
                        Recent Applications
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs text-teal-600">View All</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="space-y-2">
                      {/* Table header */}
                      <div className="grid grid-cols-4 gap-2 px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <span>Candidate</span>
                        <span>Applied For</span>
                        <span className="text-center">AI Match</span>
                        <span className="text-right">Status</span>
                      </div>
                      {recentApplications.map((app, i) => (
                        <div key={i} className="grid grid-cols-4 gap-2 items-center px-3 py-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                              {app.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-sm font-medium text-slate-700 truncate">{app.name}</span>
                          </div>
                          <span className="text-sm text-slate-500">{app.role}</span>
                          <div className="text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${app.match}%` }} />
                              </div>
                              <span className="text-xs font-bold text-slate-700">{app.match}%</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={`${app.statusColor} border text-[10px]`}>{app.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Interviews */}
                <Card className="bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                        <Calendar className="h-4 w-4 text-teal-600" />
                        Upcoming Interviews
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs text-teal-600">
                        <Calendar className="h-3 w-3 mr-1" /> Full Calendar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="space-y-3">
                      {upcomingInterviews.map((iv, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="flex-shrink-0 w-14 h-14 bg-teal-50 rounded-xl border border-teal-100 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-teal-700">{iv.date}</span>
                            <span className="text-[10px] font-medium text-teal-500 uppercase">{iv.month}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">{iv.name}</p>
                            <p className="text-xs text-slate-500">{iv.role} • {iv.time}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      ))}
                      <Button variant="outline" className="w-full text-xs text-teal-600 border-teal-200 hover:bg-teal-50 mt-2 h-9">
                        + Schedule New Interview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ─── Jobs Tab (preserved) ─── */}
            <TabsContent value="jobs" className="space-y-6">
              <Card className="bg-white border border-slate-200/80">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                  <CardTitle>Job Management</CardTitle>
                  <CardDescription>Manage your active job postings and requirements</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex-1"><Input placeholder="Search jobs..." className="max-w-sm" /></div>
                    <Select>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="filled">Filled</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
                    <Button className="bg-teal-600 hover:bg-teal-700"><Upload className="h-4 w-4 mr-2" /> Post New Job</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card className="border-teal-100">
                      <CardHeader className="pb-2"><CardTitle className="text-lg">Active Jobs</CardTitle></CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-teal-600">{dashboardData.jobs.active}</div>
                        <p className="text-sm text-slate-500">Currently recruiting</p>
                      </CardContent>
                    </Card>
                    <Card className="border-blue-100">
                      <CardHeader className="pb-2"><CardTitle className="text-lg">Filled Positions</CardTitle></CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{dashboardData.jobs.filled}</div>
                        <p className="text-sm text-slate-500">Successfully filled</p>
                      </CardContent>
                    </Card>
                    <Card className="border-orange-100">
                      <CardHeader className="pb-2"><CardTitle className="text-lg">Pending Approval</CardTitle></CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-orange-600">{dashboardData.jobs.pending}</div>
                        <p className="text-sm text-slate-500">Awaiting approval</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2">Job Management</h3>
                    <p className="text-slate-500 mb-4">Create and manage job postings</p>
                    <Button className="bg-slate-900 hover:bg-slate-800">Create New Job Posting</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Candidates Tab (preserved) ─── */}
            <TabsContent value="candidates" className="space-y-6">
              <Card className="bg-white border border-slate-200/80">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                  <CardTitle>Candidate Management</CardTitle>
                  <CardDescription>Review and manage candidate applications</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex-1"><Input placeholder="Search candidates..." className="max-w-sm" /></div>
                    <Select>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Candidates</SelectItem>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="interviewed">Interviewed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
                  </div>
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2">Candidate Pipeline</h3>
                    <p className="text-slate-500 mb-4">Advanced candidate management and screening tools</p>
                    <Button className="bg-slate-900 hover:bg-slate-800">View All Candidates</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Interviews Tab (preserved) ─── */}
            <TabsContent value="interviews" className="space-y-6">
              <Card className="bg-white border border-slate-200/80">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                  <CardTitle>Interview Management</CardTitle>
                  <CardDescription>Schedule and manage candidate interviews</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card className="border-blue-100">
                      <CardHeader className="pb-2"><CardTitle className="text-lg">Scheduled</CardTitle></CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{dashboardData.interviews.scheduled}</div>
                        <p className="text-sm text-slate-500">Upcoming interviews</p>
                      </CardContent>
                    </Card>
                    <Card className="border-green-100">
                      <CardHeader className="pb-2"><CardTitle className="text-lg">Completed</CardTitle></CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600">{dashboardData.interviews.completed}</div>
                        <p className="text-sm text-slate-500">This month</p>
                      </CardContent>
                    </Card>
                    <Card className="border-orange-100">
                      <CardHeader className="pb-2"><CardTitle className="text-lg">Pending Review</CardTitle></CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-orange-600">{dashboardData.interviews.pending}</div>
                        <p className="text-sm text-slate-500">Awaiting feedback</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="text-center py-8">
                    <Video className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2">Interview Scheduler</h3>
                    <p className="text-slate-500 mb-4">Schedule and manage candidate interviews</p>
                    <Button className="bg-slate-900 hover:bg-slate-800">Schedule New Interview</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default RecruiterDashboard;
