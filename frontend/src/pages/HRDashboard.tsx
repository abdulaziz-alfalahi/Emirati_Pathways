import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { TeamManagementTab } from '@/components/hr/TeamManagementTab';
import { Checkbox } from "@/components/ui/checkbox";
import RecruiterInterviews from '@/components/recruiter/Interviews';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
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
  const { t } = useTranslation('hr-dashboard');
  const navigate = useNavigate();

  const [shortlistedCandidates, setShortlistedCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<'message' | 'interview' | 'analyze' | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTitle, setInterviewTitle] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Team Member Selection for Interviews
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const COMPANY_ID = "7e5edea0-ea73-436c-b7ed-f47cfe57423a"; // Mock/Auth derived

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';
        const response = await axios.get(`${baseUrl}/api/company/team/members?company_id=${COMPANY_ID}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';
        const response = await axios.get(`${baseUrl}/api/hr/jobs?limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setActiveJobs(response.data.data.job_postings);
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
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';
      await axios.delete(`${baseUrl}/api/hr/jobs/${jobId}/shortlist/${candidateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';
      const response = await axios.delete(`${baseUrl}/api/recruiter/jd/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';
      await axios.post(`${baseUrl}/api/communication/messages`, {
        recipient_id: selectedCandidate.candidate_id,
        content: messageContent,
        message_type: 'text'
      }, {
        headers: { Authorization: `Bearer ${token}` }
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
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';

      // Look up application_id if available, otherwise might fail if strict
      // For now we assume we have enough context or backend handles it loosely
      await axios.post(`${baseUrl}/api/interviews/sessions`, {
        candidate_id: selectedCandidate.candidate_id,
        scheduled_at: new Date(interviewDate).toISOString(),
        title: interviewTitle,
        application_id: selectedCandidate.application_id, // Ensure backend provides this in shortlist view
        attendees: selectedAttendees // Pass attendees
      }, {
        headers: { Authorization: `Bearer ${token}` }
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
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Metrics
      try {
        const metricsResponse = await axios.get(`${baseUrl}/api/hr/dashboard/metrics`, { headers });
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
        await axios.get(`${baseUrl}/api/hr/jobs`, { headers });
      } catch (error) {
        console.error("Failed to fetch jobs", error);
      }

      // 3. Fetch Shortlisted Candidates
      try {
        const shortlistResponse = await axios.get(`${baseUrl}/api/hr/jobs/shortlisted-candidates`, { headers });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 font-dubai">
      {/* Navigation */}
      <HybridGovernmentNavFixed showAuthButtons={true} />



      {/* Main Content */}
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-dubai-bold text-slate-900 mb-2">
                  HR Management Dashboard
                </h1>
                <p className="text-slate-600 font-dubai-medium">
                  Welcome back, Sara Saeed - Manage UAE National talent acquisition
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-dubai-medium">
                  HR Manager
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-dubai-medium">
                  Talent33 Aligned
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4">
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium"
                onClick={() => navigate('/recruiter/jobs/new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Post New Job
              </Button>
              <Button
                variant="outline"
                className="font-dubai-medium"
                onClick={() => navigate('/recruiter/candidates')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Candidates
              </Button>
              <Button
                variant="outline"
                className="font-dubai-medium"
                onClick={() => navigate('/recruiter/analytics')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Reports
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm">
              <TabsTrigger value="overview" className="font-dubai-medium">Overview</TabsTrigger>
              <TabsTrigger value="team" className="font-dubai-medium">Team</TabsTrigger>
              <TabsTrigger value="candidates" className="font-dubai-medium">Candidates</TabsTrigger>
              <TabsTrigger value="interviews" className="font-dubai-medium">Interviews</TabsTrigger>
              <TabsTrigger value="positions" className="font-dubai-medium">Positions</TabsTrigger>
              <TabsTrigger value="analytics" className="font-dubai-medium">Analytics</TabsTrigger>
              <TabsTrigger value="reports" className="font-dubai-medium">Reports</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Total Candidates</CardTitle>
                    <Users className="h-4 w-4 text-teal-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.candidates.total}</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Active Positions</CardTitle>
                    <Briefcase className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.positions.open}</div>
                    <p className="text-xs text-slate-500 font-dubai-medium">
                      {dashboardData.positions.pending} pending approval
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Avg. Time to Hire</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.recruitment.averageTimeToHire} days</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      -5 days from last quarter
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Success Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.recruitment.successRate}%</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      +8% from last quarter
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recruitment Pipeline */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Recruitment Pipeline</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Current status of candidates in the recruitment process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-blue-600">{dashboardData.candidates.total}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Total Candidates</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-yellow-600">{dashboardData.candidates.active}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Active</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-orange-600">{dashboardData.candidates.shortlisted}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Shortlisted</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-purple-600">{dashboardData.candidates.interviewed}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Interviewed</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-green-600">{dashboardData.candidates.hired}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Hired</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Recent Activity</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Latest updates from your recruitment activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.activity.length > 0 ? (
                      dashboardData.activity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                          <div className="flex-shrink-0">
                            {activity.type === 'candidate_hired' && (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                            )}
                            {activity.type === 'interview_scheduled' && (
                              <Calendar className="h-5 w-5 text-blue-500 mt-1" />
                            )}
                            {activity.type === 'application_received' && (
                              <FileText className="h-5 w-5 text-purple-500 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-dubai-medium text-slate-900">
                              {activity.title}
                            </p>
                            <p className="text-sm text-slate-600 font-dubai">
                              {activity.description}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 font-dubai">
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 font-dubai-medium">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Candidates Tab */}
            <TabsContent value="candidates" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Candidate Management</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Manage and review candidate applications
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
                    <Button
                      className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium shadow-sm transition-all hover:shadow-md"
                      onClick={() => navigate('/recruiter/jd-builder')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Position
                    </Button>
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
                          <Button variant="link" onClick={() => navigate('/recruiter/jobs')}>View All Positions</Button>
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

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Reports & Exports</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Generate and download recruitment reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Report Generation</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Generate detailed recruitment reports</p>
                    <div className="flex justify-center space-x-4">
                      <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                      <Button variant="outline" className="font-dubai-medium">
                        <Eye className="h-4 w-4 mr-2" />
                        View Templates
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
