import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { restClient } from '@/utils/api';
import UserManagerEnhanced from '@/components/admin/UserManagerEnhanced';
import GrowthOperatorManagerEnhanced from '@/components/admin/GrowthOperatorManagerEnhanced';
import AdminRoleRequests from '@/components/admin/AdminRoleRequests';
import AuditLogTab from '@/components/admin/AuditLogTab';
import AdminInterviews from '@/components/admin/AdminInterviews';
import FeatureFlagsTab from '@/components/admin/FeatureFlagsTab';
import Messages from '@/components/recruiter/Messages';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users, Briefcase, TrendingUp, Shield, AlertTriangle, CheckCircle, Clock,
  BarChart3, UserCheck, FileText, MessageSquare, Activity, Video, Loader2,
  ClipboardCopy, RefreshCw, UserPlus, Send, Mail, Settings, Eye, HelpCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const b = (en: string, ar: string) => isRTL ? ar : en;

  // Derive tab from URL or default to "overview"
  const activeTab = searchParams.get("tab") || "overview";
  const [initialLoading, setInitialLoading] = useState(true);

  // Feedback detail viewer states
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warning'>('all');
  const [logSearch, setLogSearch] = useState('');
  const [showClarificationInput, setShowClarificationInput] = useState(false);
  const [clarificationNotes, setClarificationNotes] = useState('');
  const [isSubmittingClarification, setIsSubmittingClarification] = useState(false);

  // Handler for UI tab changes
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };
  const [dashboardData, setDashboardData] = useState({
    platform: {
      totalUsers: 0,
      activeUsers: 0,
      newRegistrations: 0,
      totalJobs: 0,
      totalApplications: 0,
      successfulMatches: 0
    },
    analytics: {
      userGrowthRate: 0,
      applicationSuccessRate: 0,
      averageMatchScore: 0,
      systemUptime: 0,
      visitorTrends: [],
      userActivity: []
    },
    moderation: {
      pendingReviews: 0,
      reportedContent: 0,
      flaggedUsers: 0,
      systemAlerts: 0
    },
    feedback: {
      total: 0,
      open: 0,
      bugs: 0,
      features: 0,
      today: 0
    },
    activity: [],
    system: {
      cpu_percent: 0,
      memory_percent: 0,
      disk_percent: 0,
      disk_total: 0,
      disk_free: 0
    }
  });

  const [feedbackList, setFeedbackList] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Invitation pipeline data
  const [invitationData, setInvitationData] = useState<any>({
    total: 0, accepted: 0, pending: 0, expired: 0, recent: []
  });

  // Security stats (live)
  const [securityData, setSecurityData] = useState<any>({
    security_score: 0, failed_logins_24h: 0, active_sessions: 0, verified_users_pct: 0
  });

  const [missionVideoUrl, setMissionVideoUrl] = useState('https://www.youtube.com/embed/zTct6QW-V28');
  const [savingVideoUrl, setSavingVideoUrl] = useState(false);

  const loadMissionVideoUrl = async () => {
    try {
      const response = await restClient.get('/api/admin/settings');
      if (response.data && response.data.status === 'success' && response.data.data.mission_video_url) {
        setMissionVideoUrl(response.data.data.mission_video_url.value);
      }
    } catch (error) {
      console.error("Failed to load mission video url setting:", error);
    }
  };

  const handleSaveVideoUrl = async () => {
    setSavingVideoUrl(true);
    try {
      const response = await restClient.put('/api/admin/settings/mission_video_url', { value: missionVideoUrl });
      if (response.data && response.data.status === 'success') {
        toast({
          title: b("Setting Saved", "تم حفظ الإعداد"),
          description: b("Mission video URL updated successfully.", "تم تحديث رابط فيديو الرسالة بنجاح."),
        });
      } else {
        throw new Error(response.data?.message || 'Failed to save');
      }
    } catch (error) {
      console.error("Failed to save mission video url setting:", error);
      toast({
        title: b("Error", "خطأ"),
        description: b("Failed to update mission video URL.", "فشل تحديث رابط فيديو الرسالة."),
        variant: "destructive",
      });
    } finally {
      setSavingVideoUrl(false);
    }
  };

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load settings when system tab is active
  useEffect(() => {
    if (activeTab === 'system') {
      loadMissionVideoUrl();
    }
  }, [activeTab]);

  const getUserDisplayName = () => {
    return user?.full_name || user?.email || 'Administrator';
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Admin logout process...');
      await signOut(); // Use real sign out from context
      console.log('✅ Admin logout completed');
      navigate('/auth');
    } catch (error) {
      console.error('Admin logout error:', error);
      navigate('/auth');
    }
  };



  const loadFeedbackList = async () => {
    setLoadingFeedback(true);
    try {
      const response = await restClient.get('/api/feedback/');
      if (response.data && response.data.success) {
        setFeedbackList(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load feedback list", error);
      toast({
        title: "Error",
        description: "Failed to load feedback list.",
        variant: "destructive",
      });
    } finally {
      setLoadingFeedback(false);
    }
  };

  const updateFeedbackStatus = async (id: string, newStatus: string) => {
    try {
      const response = await restClient.put(`/api/feedback/${id}/status`, { status: newStatus });
      if (response.data && response.data.success) {
        toast({
          title: "Success",
          description: `Feedback marked as ${newStatus}`,
        });
        // Optimistic update
        setFeedbackList((prev: any[]) => prev.map((item: any) =>
          item.id === id ? { ...item, status: newStatus } : item
        ));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: "Error",
        description: "Failed to update feedback status.",
        variant: "destructive",
      });
    }
  };

  // Load feedback when tab changes
  useEffect(() => {
    if (activeTab === 'feedback') {
      loadFeedbackList();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      // Use restClient which handles auth token automatically
      const [response, feedbackResponse, invitationResponse, securityResponse] = await Promise.all([
        restClient.get('/api/admin/dashboard'),
        restClient.get('/api/feedback/stats'),
        restClient.get('/api/admin/invitations/stats').catch(() => ({ data: { success: false } })),
        restClient.get('/api/admin/security/stats').catch(() => ({ data: { success: false } }))
      ]);

      const feedbackStats = feedbackResponse.data?.success ? feedbackResponse.data.stats : {
        total: 0, open: 0, bugs: 0, features: 0, today: 0
      };

      // Set invitation data
      if (invitationResponse.data?.success) {
        setInvitationData(invitationResponse.data.data);
      }

      // Set security data
      if (securityResponse.data?.success) {
        setSecurityData(securityResponse.data.data);
      }

      if (response.data && response.data.data) {
        const apiData = response.data.data;

        // Transform backend data to frontend structure
        setDashboardData({
          platform: {
            totalUsers: apiData.users?.total || 0,
            activeUsers: apiData.health?.components?.users?.active_users || 0,
            newRegistrations: apiData.health?.components?.users?.new_users_24h || 0,
            totalJobs: apiData.health?.components?.content?.total_content || 0, // Placeholder
            totalApplications: 0, // Placeholder
            successfulMatches: 0 // Placeholder
          },
          analytics: {
            userGrowthRate: apiData.analytics?.userGrowthRate || 0,
            applicationSuccessRate: apiData.analytics?.applicationSuccessRate || 0,
            averageMatchScore: apiData.analytics?.averageMatchScore || 0,
            systemUptime: apiData.analytics?.systemUptime || 99.9,
            visitorTrends: apiData.analytics?.visitorTrends || [],
            userActivity: apiData.analytics?.userActivity || [
              { name: 'Active', value: 0 },
              { name: 'Inactive', value: 0 }
            ]
          },
          moderation: {
            pendingReviews: apiData.notifications?.unread_count || 0, // Map notifications to reviews as proxy
            reportedContent: 0,
            flaggedUsers: 0,
            systemAlerts: apiData.notifications?.recent?.length || 0
          },
          feedback: feedbackStats,
          activity: (apiData.notifications?.recent || []).map((n: any, i: number) => ({
            id: i,
            type: n.notification_type || 'system_alert',
            title: n.title,
            description: n.message,
            timestamp: n.created_at || new Date().toISOString(),
            severity: n.severity || 'info'
          })),
          system: {
            cpu_percent: apiData.health?.system_resources?.cpu_percent || 0,
            memory_percent: apiData.health?.system_resources?.memory_percent || 0,
            disk_percent: apiData.health?.system_resources?.disk_percent || 0,
            disk_total: apiData.health?.system_resources?.disk_total_gb || 0,
            disk_free: apiData.health?.system_resources?.disk_free_gb || 0
          }
        });
      } else {
        console.log('API call returned no data, using mock data');
        setMockData();
      }
    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
      setMockData();
    } finally {
      setInitialLoading(false);
    }
  };

  const setMockData = () => {
    setDashboardData({
      platform: {
        totalUsers: 2847,
        activeUsers: 1923,
        newRegistrations: 156,
        totalJobs: 342,
        totalApplications: 8934,
        successfulMatches: 1247
      },
      analytics: {
        userGrowthRate: 15.3,
        applicationSuccessRate: 68.2,
        averageMatchScore: 8.7,
        systemUptime: 99.8,
        visitorTrends: [],
        userActivity: []
      },
      moderation: {
        pendingReviews: 23,
        reportedContent: 5,
        flaggedUsers: 2,
        systemAlerts: 1
      },
      activity: [
        {
          id: 1,
          type: 'system_alert',
          title: 'System Maintenance Scheduled',
          description: 'Scheduled maintenance window for database optimization',
          timestamp: new Date().toISOString(),
          severity: 'info'
        },
        {
          id: 2,
          type: 'user_registration',
          title: 'New User Registration Spike',
          description: '50+ new registrations in the last hour',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          severity: 'success'
        },
        {
          id: 3,
          type: 'security_alert',
          title: 'Security Scan Completed',
          description: 'Weekly security scan completed successfully',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          severity: 'success'
        }
      ],
      feedback: {
        total: 12,
        open: 5,
        bugs: 2,
        features: 3,
        today: 1
      },
      system: {
        cpu_percent: 45,
        memory_percent: 62,
        disk_percent: 28,
        disk_total: 512,
        disk_free: 368
      }
    });
  };

  // Loading spinner on initial mount
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 font-dubai">
        <HybridGovernmentNavFixed showAuthButtons={true} />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <p className="text-sm text-slate-500 font-dubai-medium">{b('Loading dashboard...', 'جارٍ تحميل لوحة التحكم...')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 font-dubai">
      {/* Navigation */}
      <HybridGovernmentNavFixed showAuthButtons={true} />

      {/* Main Content */}
      <div className="pt-20 pb-8">
        <div className="min-h-screen bg-background">
          {/* Header */}
          <div className="bg-card border-b">
            <div className="container mx-auto px-4 py-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {b('System Administration', 'إدارة النظام')}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {b('Welcome back', 'مرحباً بعودتك')}, {getUserDisplayName()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-ehrdc-teal/10 text-ehrdc-teal">
                    {b('Administrator', 'مسؤول النظام')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="grid w-full grid-cols-10 gap-1 h-auto p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="overview" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm">{b('Overview', 'نظرة عامة')}</TabsTrigger>
                <TabsTrigger value="users" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm">{b('Users', 'المستخدمون')}</TabsTrigger>
                <TabsTrigger value="operators" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {b('Operators', 'المشغلون')}
                </TabsTrigger>
                <TabsTrigger value="interviews" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm flex items-center gap-1">
                  <Video className="h-3.5 w-3.5" />
                  {b('Interviews', 'المقابلات')}
                </TabsTrigger>
                <TabsTrigger value="feature-flags" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm flex items-center gap-1">
                  <Settings className="h-3.5 w-3.5" />
                  Modules
                </TabsTrigger>
                <TabsTrigger value="feedback" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {b('Feedback', 'الملاحظات')}
                </TabsTrigger>
                <TabsTrigger value="messaging" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {b('Messaging', 'الرسائل')}
                </TabsTrigger>
                <TabsTrigger value="requests" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm flex items-center gap-1">
                  <UserPlus className="h-3.5 w-3.5" />
                  {b('Requests', 'الطلبات')}
                </TabsTrigger>
                <TabsTrigger value="audit" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  {b('Audit Log', 'سجل التدقيق')}
                </TabsTrigger>
                <TabsTrigger value="system" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm">{b('System', 'النظام')}</TabsTrigger>
                <TabsTrigger value="security" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm">{b('Security', 'الأمان')}</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Platform Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.platform.totalUsers.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        +{dashboardData.platform.newRegistrations} new this month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.platform.activeUsers.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        {dashboardData.platform.totalUsers > 0 ? Math.round((dashboardData.platform.activeUsers / dashboardData.platform.totalUsers) * 100) : 0}% {b('of total users', 'من إجمالي المستخدمين')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.platform.totalJobs.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        Across all categories
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Applications</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.platform.totalApplications.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        Total submitted
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Successful Matches</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.platform.successfulMatches.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        {dashboardData.platform.totalApplications > 0 ? Math.round((dashboardData.platform.successfulMatches / dashboardData.platform.totalApplications) * 100) : 0}% {b('success rate', 'معدل النجاح')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.analytics.systemUptime}%</div>
                      <p className="text-xs text-muted-foreground">
                        Last 30 days
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* System Health Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Platform Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">User Growth Rate</span>
                          <span className="text-sm font-bold text-green-600">+{dashboardData.analytics.userGrowthRate}%</span>
                        </div>
                        <Progress value={dashboardData.analytics.userGrowthRate} className="w-full" />

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Application Success Rate</span>
                          <span className="text-sm font-bold">{dashboardData.analytics.applicationSuccessRate}%</span>
                        </div>
                        <Progress value={dashboardData.analytics.applicationSuccessRate} className="w-full" />

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Average Match Score</span>
                          <span className="text-sm font-bold">{dashboardData.analytics.averageMatchScore}/10</span>
                        </div>
                        <Progress value={dashboardData.analytics.averageMatchScore * 10} className="w-full" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Moderation Queue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Pending Reviews</span>
                          <Badge variant={dashboardData.moderation.pendingReviews > 20 ? "destructive" : "secondary"}>
                            {dashboardData.moderation.pendingReviews}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Reported Content</span>
                          <Badge variant={dashboardData.moderation.reportedContent > 10 ? "destructive" : "secondary"}>
                            {dashboardData.moderation.reportedContent}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Flagged Users</span>
                          <Badge variant={dashboardData.moderation.flaggedUsers > 5 ? "destructive" : "secondary"}>
                            {dashboardData.moderation.flaggedUsers}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">System Alerts</span>
                          <Badge variant={dashboardData.moderation.systemAlerts > 0 ? "destructive" : "secondary"}>
                            {dashboardData.moderation.systemAlerts}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Invitation Pipeline */}
                <Card className="border-l-4 border-l-teal-500">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Send className="h-5 w-5 mr-2" />
                      Invitation Pipeline
                    </CardTitle>
                    <CardDescription>
                      NAFIS magic-link invitations to job seekers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Total Sent</span>
                        <span className="text-2xl font-bold">{invitationData.total}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Accepted</span>
                        <span className="text-2xl font-bold text-green-600">{invitationData.accepted}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Pending</span>
                        <span className="text-2xl font-bold text-amber-600">{invitationData.pending}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Conversion</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {invitationData.total > 0 ? Math.round((invitationData.accepted / invitationData.total) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Feedback Overview (FUT) */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Feedback Overview
                    </CardTitle>
                    <CardDescription>
                      User reported issues and feedback from the widget
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Total Reports</span>
                        <span className="text-2xl font-bold">{dashboardData.feedback?.total || 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Open Issues</span>
                        <span className="text-2xl font-bold text-orange-600">{dashboardData.feedback?.open || 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Today</span>
                        <span className="text-2xl font-bold text-blue-600">{dashboardData.feedback?.today || 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Bugs</span>
                        <span className="text-2xl font-bold text-red-600">{dashboardData.feedback?.bugs || 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Features</span>
                        <span className="text-2xl font-bold text-green-600">{dashboardData.feedback?.features || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent System Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2" />
                      Recent System Activity
                    </CardTitle>
                    <CardDescription>
                      Latest system events and administrative actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.activity.length > 0 ? (
                        dashboardData.activity.map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {activity.severity === 'success' && (
                                <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                              )}
                              {activity.severity === 'info' && (
                                <Clock className="h-4 w-4 text-blue-500 mt-1" />
                              )}
                              {activity.severity === 'warning' && (
                                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-1" />
                              )}
                              {activity.severity === 'error' && (
                                <AlertTriangle className="h-4 w-4 text-red-500 mt-1" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {activity.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {activity.description}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No recent system activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>


              {/* Feedback Tab */}
              <TabsContent value="feedback" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Feedback & Issues Reports</span>
                      <Button variant="outline" size="sm" onClick={loadFeedbackList}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Review feedback submitted by users via the widget. Use "Copy for Developer" to share with engineering.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr className="text-left">
                            <th className="p-3 font-medium">Type</th>
                            <th className="p-3 font-medium">Status</th>
                            <th className="p-3 font-medium">Message</th>
                            <th className="p-3 font-medium">User & Page</th>
                            <th className="p-3 font-medium">Date</th>
                            <th className="p-3 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingFeedback ? (
                            <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                          ) : feedbackList.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No feedback received yet.</td></tr>
                          ) : (
                            feedbackList.map((item: any) => (
                              <tr key={item.id} className="border-b hover:bg-muted/50 transition-colors">
                                <td className="p-3">
                                  <div className="flex flex-col gap-1">
                                    <Badge variant={item.type === 'bug' ? 'destructive' : 'secondary'}>
                                      {item.type.toUpperCase()}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="p-3">
                                  {(() => {
                                    const nStatus = item.status ? item.status.toLowerCase() : 'open';
                                    if (nStatus === 'resolved') {
                                      return <Badge variant="outline" className="text-green-600 border-green-600">RESOLVED</Badge>;
                                    } else if (nStatus === 'pending_clarification') {
                                      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">NEED DETAIL</Badge>;
                                    } else {
                                      return <Badge className="bg-blue-600 text-white">OPEN</Badge>;
                                    }
                                  })()}
                                </td>
                                <td className="p-3 max-w-md">
                                  <p className="font-medium truncate">{item.message}</p>
                                  <p className="text-xs text-muted-foreground truncate font-mono">
                                    {item.console_logs && item.console_logs.length > 0 ? `${item.console_logs.length} logs captured` : 'No logs'}
                                  </p>
                                </td>
                                <td className="p-3">
                                  <div className="flex flex-col text-xs">
                                    <span className="font-medium">{item.role} {item.user_id ? `(#${item.user_id})` : ''}</span>
                                    <span className="text-muted-foreground truncate max-w-[150px]" title={item.metadata?.path}>
                                      {item.metadata?.path || 'Unknown path'}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 text-xs text-muted-foreground">
                                  {new Date(item.created_at).toLocaleString()}
                                </td>
                                <td className="p-3 font-dubai-medium">
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium"
                                      onClick={() => {
                                        setSelectedFeedback(item);
                                        setIsDetailsOpen(true);
                                      }}
                                    >
                                      <Eye className="h-3 w-3 mr-1" /> View Details
                                    </Button>

                                    {item.status !== 'resolved' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs border-green-200 hover:bg-green-50 text-green-700 font-medium"
                                        onClick={() => updateFeedbackStatus(item.id, 'resolved')}
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-8 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium"
                                      onClick={() => {
                                        const text = `
**Feedback Report**
ID: ${item.id}
User: ${item.role} (ID: ${item.user_id})
Type: ${item.type}
Page: ${item.metadata?.path || item.pageUrl || 'N/A'}
Date: ${new Date(item.created_at).toLocaleString()}

**Message:**
${item.message}

**Console Logs:**
\`\`\`
${Array.isArray(item.console_logs) ? item.console_logs.join('\n') : JSON.stringify(item.console_logs || [])}
\`\`\`

**Metadata:**
${JSON.stringify(item.metadata, null, 2)}
                                                        `.trim();
                                        navigator.clipboard.writeText(text);
                                        toast({
                                          title: "Copied",
                                          description: "Feedback report copied to clipboard",
                                        });
                                      }}
                                    >
                                      <ClipboardCopy className="h-3 w-3 mr-1" />
                                      Copy for Dev
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Feedback Detail Inspection Dialog */}
                <Dialog open={isDetailsOpen} onOpenChange={(open) => {
                  setIsDetailsOpen(open);
                  if (!open) {
                    setShowClarificationInput(false);
                    setClarificationNotes('');
                  }
                }}>
                  <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto font-dubai">
                    {selectedFeedback && (
                      <>
                        <DialogHeader>
                          <div className="flex items-center gap-2 mb-1">
                            {(() => {
                              const nStatus = selectedFeedback.status ? selectedFeedback.status.toLowerCase() : 'open';
                              if (nStatus === 'resolved') {
                                return <Badge variant="outline" className="text-green-600 border-green-600">RESOLVED</Badge>;
                              } else if (nStatus === 'pending_clarification') {
                                return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">NEED DETAIL</Badge>;
                              } else {
                                return <Badge className="bg-blue-600 text-white">OPEN</Badge>;
                              }
                            })()}
                            <Badge variant={selectedFeedback.type === 'bug' ? 'destructive' : 'secondary'}>
                              {selectedFeedback.type?.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(selectedFeedback.created_at).toLocaleString()}
                            </span>
                          </div>
                          <DialogTitle className="text-xl font-bold text-slate-900 leading-snug">
                            {selectedFeedback.metadata?.title || 'Feedback Report'}
                          </DialogTitle>
                          <DialogDescription className="text-xs text-slate-500 font-mono">
                            ID: {selectedFeedback.id}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-4">
                          {/* Left Side: Report Message & Screenshot */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</h4>
                              <div className="bg-slate-50 border p-3 rounded-lg text-sm text-slate-800 whitespace-pre-wrap min-h-[100px] leading-relaxed">
                                {selectedFeedback.message}
                              </div>
                            </div>

                            {selectedFeedback.status === 'pending_clarification' && selectedFeedback.resolution_notes && (
                              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-800 leading-relaxed">
                                <strong>Clarification Request Sent:</strong> {selectedFeedback.resolution_notes}
                              </div>
                            )}

                            {showClarificationInput && (
                              <div className="border border-amber-200 bg-amber-50/50 p-4 rounded-lg space-y-3 animate-in slide-in-from-top-2 duration-300">
                                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Clarification Request Message</h4>
                                <Textarea
                                  value={clarificationNotes}
                                  onChange={(e) => setClarificationNotes(e.target.value)}
                                  placeholder="Type your request for details here (e.g. 'Can you specify the browser/version and provide exact steps?')"
                                  className="bg-white border-amber-200 focus:border-amber-500 min-h-[80px]"
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                                    onClick={() => {
                                      setShowClarificationInput(false);
                                      setClarificationNotes('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                                    onClick={async () => {
                                      if (!clarificationNotes.trim()) return;
                                      setIsSubmittingClarification(true);
                                      try {
                                        await restClient.put(`/api/feedback/${selectedFeedback.id}/status`, {
                                          status: 'pending_clarification',
                                          resolution_notes: clarificationNotes
                                        });
                                        setSelectedFeedback((prev: any) => prev ? { ...prev, status: 'pending_clarification', resolution_notes: clarificationNotes } : null);
                                        setShowClarificationInput(false);
                                        setClarificationNotes('');
                                        loadFeedbackList();
                                        toast({
                                          title: "Clarification Requested",
                                          description: "Clarification request sent to the user successfully",
                                        });
                                      } catch (err) {
                                        console.error(err);
                                        toast({
                                          title: "Error",
                                          description: "Failed to request clarification",
                                          variant: "destructive"
                                        });
                                      } finally {
                                        setIsSubmittingClarification(false);
                                      }
                                    }}
                                    disabled={isSubmittingClarification || !clarificationNotes.trim()}
                                  >
                                    {isSubmittingClarification && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                    Send Request
                                  </Button>
                                </div>
                              </div>
                            )}

                            {selectedFeedback.metadata?.reproSteps && (
                              <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Steps to Reproduce</h4>
                                <pre className="bg-slate-50 border p-3 rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                                  {selectedFeedback.metadata.reproSteps}
                                </pre>
                              </div>
                            )}

                            {selectedFeedback.screenshot && (
                              <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex justify-between items-center">
                                  <span>Viewport Screenshot</span>
                                  <a 
                                    href={selectedFeedback.screenshot} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                                  >
                                    View Full Size
                                  </a>
                                </h4>
                                <div className="border rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center max-h-[320px] shadow-sm cursor-pointer hover:opacity-95 transition-opacity">
                                  <img 
                                    src={selectedFeedback.screenshot} 
                                    alt="Feedback Screenshot" 
                                    className="max-h-[320px] w-full object-contain"
                                    onClick={() => {
                                      const newTab = window.open();
                                      if (newTab) {
                                        newTab.document.write(`<img src="${selectedFeedback.screenshot}" style="max-width:100%; height:auto;" />`);
                                        newTab.document.title = `Feedback Screenshot - ${selectedFeedback.id}`;
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Side: Diagnostics & Metadata */}
                          <div className="space-y-4 flex flex-col">
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Diagnostic Context</h4>
                              <div className="bg-slate-50 border rounded-lg p-3 text-xs space-y-2 leading-relaxed">
                                <div className="grid grid-cols-3 gap-1">
                                  <span className="text-slate-500 font-medium">Page URL:</span>
                                  <a 
                                    href={selectedFeedback.pageUrl || '#'} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="col-span-2 text-teal-600 hover:underline truncate"
                                  >
                                    {selectedFeedback.pageUrl || 'N/A'}
                                  </a>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <span className="text-slate-500 font-medium">Path:</span>
                                  <span className="col-span-2 font-mono truncate">{selectedFeedback.metadata?.path || 'N/A'}</span>
                                </div>
                                {selectedFeedback.metadata?.queryParams && (
                                  <div className="grid grid-cols-3 gap-1">
                                    <span className="text-slate-500 font-medium">Query Params:</span>
                                    <span className="col-span-2 font-mono truncate">{selectedFeedback.metadata.queryParams}</span>
                                  </div>
                                )}
                                <div className="grid grid-cols-3 gap-1">
                                  <span className="text-slate-500 font-medium">User Role:</span>
                                  <span className="col-span-2 font-medium text-slate-800">{selectedFeedback.role || 'guest'}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <span className="text-slate-500 font-medium">User Email:</span>
                                  <span className="col-span-2 text-slate-800">{selectedFeedback.metadata?.userEmail || 'N/A'}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <span className="text-slate-500 font-medium">Resolution:</span>
                                  <span className="col-span-2 text-slate-800">{selectedFeedback.metadata?.screenSize || 'N/A'}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <span className="text-slate-500 font-medium">Language:</span>
                                  <span className="col-span-2 text-slate-800">{selectedFeedback.metadata?.language || 'N/A'}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <span className="text-slate-500 font-medium">Network Status:</span>
                                  <span className="col-span-2">
                                    <Badge variant="outline" className={selectedFeedback.metadata?.isOnline === 'online' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                                      {selectedFeedback.metadata?.isOnline || 'online'}
                                    </Badge>
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <span className="text-slate-500 font-medium">User Agent:</span>
                                  <span className="col-span-2 text-[10px] text-slate-600 font-mono break-all max-h-12 overflow-y-auto" title={selectedFeedback.metadata?.userAgent}>
                                    {selectedFeedback.metadata?.userAgent || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Console Logs section */}
                            <div className="flex-1 flex flex-col min-h-[220px]">
                              <div className="flex justify-between items-center mb-1">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Console & Crash Logs</h4>
                                <div className="flex gap-1 text-[10px]">
                                  <button 
                                    className={`px-1.5 py-0.5 rounded border ${logFilter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                                    onClick={() => setLogFilter('all')}
                                  >
                                    All
                                  </button>
                                  <button 
                                    className={`px-1.5 py-0.5 rounded border ${logFilter === 'error' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                    onClick={() => setLogFilter('error')}
                                  >
                                    Errors
                                  </button>
                                  <button 
                                    className={`px-1.5 py-0.5 rounded border ${logFilter === 'warning' ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                                    onClick={() => setLogFilter('warning')}
                                  >
                                    Warns
                                  </button>
                                </div>
                              </div>
                              
                              <div className="relative flex-1 flex flex-col border rounded-lg overflow-hidden">
                                <input 
                                  type="text"
                                  placeholder="Search logs..."
                                  className="w-full bg-slate-900 border-b border-slate-800 text-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-0 font-mono"
                                  value={logSearch}
                                  onChange={(e) => setLogSearch(e.target.value)}
                                />
                                <div className="flex-1 bg-slate-950 text-slate-100 font-mono text-[11px] p-3 overflow-y-auto h-[160px] leading-relaxed whitespace-pre-wrap select-text">
                                  {Array.isArray(selectedFeedback.console_logs) && selectedFeedback.console_logs.length > 0 ? (
                                    (() => {
                                      const filtered = selectedFeedback.console_logs.filter((log: string) => {
                                        const matchFilter = 
                                          logFilter === 'all' ? true :
                                          logFilter === 'error' ? (log.includes('[ERROR]') || log.includes('[CRASH]')) :
                                          logFilter === 'warning' ? log.includes('[WARN]') : true;
                                        const matchSearch = logSearch.trim() === '' ? true : log.toLowerCase().includes(logSearch.toLowerCase());
                                        return matchFilter && matchSearch;
                                      });
                                      
                                      return filtered.length > 0 ? (
                                        filtered.map((log: string, idx: number) => {
                                          const isError = log.includes('[ERROR]') || log.includes('[CRASH]') || log.includes('[RUNTIME CRASH]');
                                          const isWarn = log.includes('[WARN]');
                                          return (
                                            <div key={idx} className={`border-b border-slate-900/50 pb-1 mb-1 last:border-b-0 ${isError ? 'text-red-400' : isWarn ? 'text-amber-300' : 'text-slate-300'}`}>
                                              {log}
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <div className="text-slate-500 italic text-center py-4">No matching logs found.</div>
                                      );
                                    })()
                                  ) : (
                                    <div className="text-slate-500 italic text-center py-4">No console logs captured.</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <DialogFooter className="border-t pt-4">
                          <div className="flex justify-between items-center w-full">
                            <div className="flex gap-2">
                              {selectedFeedback.status !== 'resolved' ? (
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    className="bg-green-600 hover:bg-green-700 text-white font-medium"
                                    onClick={async () => {
                                      await updateFeedbackStatus(selectedFeedback.id, 'resolved');
                                      setSelectedFeedback((prev: any) => prev ? { ...prev, status: 'resolved' } : null);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" /> Mark as Resolved
                                  </Button>
                                  {selectedFeedback.status !== 'pending_clarification' && !showClarificationInput && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="border-amber-300 hover:bg-amber-50 text-amber-700 font-medium"
                                      onClick={() => setShowClarificationInput(true)}
                                    >
                                      <HelpCircle className="h-4 w-4 mr-2" /> Request Clarification
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="border-slate-300 hover:bg-slate-50 text-slate-700 font-medium"
                                  onClick={async () => {
                                    await updateFeedbackStatus(selectedFeedback.id, 'open');
                                    setSelectedFeedback((prev: any) => prev ? { ...prev, status: 'open' } : null);
                                  }}
                                >
                                  Reopen Report
                                </Button>
                              )}
                              
                              <Button
                                type="button"
                                variant="secondary"
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium"
                                onClick={() => {
                                  const text = `
**Feedback Report**
ID: ${selectedFeedback.id}
User: ${selectedFeedback.role} (ID: ${selectedFeedback.user_id})
Type: ${selectedFeedback.type}
Page: ${selectedFeedback.metadata?.path || selectedFeedback.pageUrl || 'N/A'}
Date: ${new Date(selectedFeedback.created_at).toLocaleString()}

**Message:**
${selectedFeedback.message}

**Console Logs:**
\`\`\`
${Array.isArray(selectedFeedback.console_logs) ? selectedFeedback.console_logs.join('\n') : JSON.stringify(selectedFeedback.console_logs || [])}
\`\`\`

**Metadata:**
${JSON.stringify(selectedFeedback.metadata, null, 2)}
                                                          `.trim();
                                  navigator.clipboard.writeText(text);
                                  toast({
                                    title: "Copied",
                                    description: "Feedback report copied to clipboard",
                                  });
                                }}
                              >
                                <ClipboardCopy className="h-4 w-4 mr-2" /> Copy for Dev
                              </Button>
                            </div>
                            
                            <Button type="button" variant="outline" className="font-medium" onClick={() => setIsDetailsOpen(false)}>
                              Close
                            </Button>
                          </div>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </TabsContent>

              {/* User Management Tab */}
              <TabsContent value="users" className="space-y-6">
                <UserManagerEnhanced />
              </TabsContent>

              {/* Growth Operators Tab */}
              <TabsContent value="operators" className="space-y-6">
                <GrowthOperatorManagerEnhanced />
              </TabsContent>

              {/* Interviews Tab */}
              <TabsContent value="interviews" className="space-y-6">
                <AdminInterviews />
              </TabsContent>

              {/* Messaging Tab */}
              <TabsContent value="messaging" className="space-y-6">
                <Messages senderRole='admin' showNewConversation />
              </TabsContent>

              {/* Role Requests Tab */}
              <TabsContent value="requests" className="space-y-6">
                <AdminRoleRequests />
              </TabsContent>







              {/* Audit Log Tab (G13) */}
              <TabsContent value="audit" className="space-y-6">
                <AuditLogTab />
              </TabsContent>

              {/* System Health Tab */}
              <TabsContent value="system" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{b('System Health Monitoring', 'مراقبة صحة النظام')}</CardTitle>
                    <CardDescription>
                      {b('Monitor system performance and health metrics', 'مراقبة أداء النظام ومقاييس الصحة')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{b('CPU Usage', 'استخدام المعالج')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-2xl font-bold ${(dashboardData.system?.cpu_percent || 0) > 80 ? 'text-red-600' : (dashboardData.system?.cpu_percent || 0) > 60 ? 'text-yellow-600' : 'text-green-600'}`}>{dashboardData.system?.cpu_percent || 0}%</div>
                          <Progress value={dashboardData.system?.cpu_percent || 0} className="w-full mt-2" />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{b('Memory Usage', 'استخدام الذاكرة')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-2xl font-bold ${(dashboardData.system?.memory_percent || 0) > 80 ? 'text-red-600' : (dashboardData.system?.memory_percent || 0) > 60 ? 'text-yellow-600' : 'text-green-600'}`}>{dashboardData.system?.memory_percent || 0}%</div>
                          <Progress value={dashboardData.system?.memory_percent || 0} className="w-full mt-2" />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{b('Disk Usage', 'استخدام القرص')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-2xl font-bold ${(dashboardData.system?.disk_percent || 0) > 80 ? 'text-red-600' : 'text-blue-600'}`}>{dashboardData.system?.disk_percent || 0}%</div>
                          <Progress value={dashboardData.system?.disk_percent || 0} className="w-full mt-2" />
                          <p className="text-xs text-gray-500 mt-1">{dashboardData.system?.disk_free || 0} GB {b('free of', 'حر من')} {dashboardData.system?.disk_total || 0} GB</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Our Mission Page Settings */}
                <Card className="border-l-4 border-l-teal-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-teal-600" />
                      {b('Our Mission Page Settings', 'إعدادات صفحة رسالتنا')}
                    </CardTitle>
                    <CardDescription>
                      {b('Configure the YouTube video to display on the public Our Mission page.', 'تكوين فيديو YouTube لعرضه على صفحة رسالتنا العامة.')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 font-dubai">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">
                        {b('YouTube Embed URL', 'رابط تضمين YouTube')}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          type="text"
                          placeholder="https://www.youtube.com/embed/..."
                          value={missionVideoUrl}
                          onChange={(e) => setMissionVideoUrl(e.target.value)}
                          className="flex-1 font-mono text-sm"
                        />
                        <Button 
                          onClick={handleSaveVideoUrl} 
                          disabled={savingVideoUrl || !missionVideoUrl}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-medium min-w-[120px]"
                        >
                          {savingVideoUrl ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {b('Saving...', 'جاري الحفظ...')}
                            </>
                          ) : (
                            b('Save Setting', 'حفظ الإعداد')
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">
                        {b('Note: The URL must be in the embed format, e.g., https://www.youtube.com/embed/VIDEO_ID', 'ملاحظة: يجب أن يكون الرابط بتنسيق التضمين، على سبيل المثال https://www.youtube.com/embed/VIDEO_ID')}
                      </p>
                    </div>

                    {/* Live Preview */}
                    {missionVideoUrl && (
                      <div className="border rounded-xl p-4 bg-slate-50">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">
                          {b('Video Embed Preview', 'معاينة تضمين الفيديو')}
                        </h4>
                        <div className="aspect-video max-w-lg mx-auto rounded-lg overflow-hidden border bg-black shadow-sm">
                          <iframe
                            className="w-full h-full"
                            src={missionVideoUrl}
                            title="Video preview"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{b('Security Management', 'إدارة الأمان')}</CardTitle>
                    <CardDescription>
                      {b('Live security metrics from platform data', 'مقاييس الأمان الحية من بيانات المنصة')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center">
                            <Shield className="h-5 w-5 mr-2" />
                            {b('Security Score', 'درجة الأمان')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-3xl font-bold ${securityData.security_score >= 80 ? 'text-green-600' : securityData.security_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {securityData.security_score}/100
                          </div>
                          <p className="text-sm text-gray-600">
                            {securityData.security_score >= 80 ? b('Excellent security posture', 'وضع أمني ممتاز') : securityData.security_score >= 50 ? b('Moderate — review recommendations', 'متوسط — راجع التوصيات') : b('Needs attention', 'يحتاج اهتمام')}
                          </p>
                          <Progress value={securityData.security_score} className="w-full mt-2" />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{b('Failed Logins', 'تسجيلات فاشلة')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-3xl font-bold ${securityData.failed_logins_24h > 10 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {securityData.failed_logins_24h}
                          </div>
                          <p className="text-sm text-gray-600">{b('Last 24 hours', 'آخر 24 ساعة')}</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{b('Active Sessions', 'جلسات نشطة')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-blue-600">
                            {securityData.active_sessions.toLocaleString()}
                          </div>
                          <p className="text-sm text-gray-600">{b('Logged in last 24h', 'سجلوا دخول خلال 24 ساعة')}</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{b('Verified Users', 'مستخدمون موثقون')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-teal-600">
                            {securityData.verified_users_pct}%
                          </div>
                          <p className="text-sm text-gray-600">{b('Phone-verified accounts', 'حسابات موثقة بالهاتف')}</p>
                          <Progress value={securityData.verified_users_pct} className="w-full mt-2" />
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              {/* Feature Flags Tab */}
              <TabsContent value="feature-flags" className="space-y-6">
                <FeatureFlagsTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div >
  );
};

export default AdminDashboard;
