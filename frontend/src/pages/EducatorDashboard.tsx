import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import Messages from '@/components/recruiter/Messages';
import { useAuth } from '@/context/AuthContext';
import { restClient } from '@/utils/api';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
  GraduationCap,
  Users,
  BookOpen,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
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
  Languages,
  Settings,
  Bell,
  Plus,
  Edit,
  FileText,
  Lightbulb,
  Globe,
  Briefcase
} from 'lucide-react';
import ScholarshipManagement from '@/components/educator/ScholarshipManagement';
import EducatorApprovals from '@/components/educator/EducatorApprovals';

interface EducatorData {
  students: {
    totalEnrolled: number;
    activeStudents: number;
    graduatingStudents: number;
    placementRate: number;
  };
  programs: {
    totalPrograms: number;
    activePrograms: number;
    industryPartnerships: number;
    certificationPrograms: number;
  };
  outcomes: {
    employmentRate: number;
    averageSalary: number;
    skillsMatchRate: number;
    industryReadiness: number;
  };
  research: {
    publications: number;
    ongoingProjects: number;
    grants: number;
    collaborations: number;
  };
  activity: Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    priority?: string;
  }>;
}



const EducatorDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const { language, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [studentsSearch, setStudentsSearch] = useState('');

  // Default data — used as fallback if API doesn't return all fields
  const defaultData: EducatorData = {
    students: { totalEnrolled: 245, activeStudents: 198, graduatingStudents: 47, placementRate: 89 },
    programs: { totalPrograms: 8, activePrograms: 6, industryPartnerships: 12, certificationPrograms: 4 },
    outcomes: { employmentRate: 92, averageSalary: 85000, skillsMatchRate: 87, industryReadiness: 91 },
    research: { publications: 45, ongoingProjects: 8, grants: 3, collaborations: 15 },
    activity: [
      { id: 1, type: 'student_placement', title: 'Student Placement Success', description: 'Fatima Al Zahra secured position as AI Engineer at ADNOC Digital', timestamp: new Date().toISOString(), priority: 'high' },
      { id: 2, type: 'industry_partnership', title: 'New Industry Partnership', description: 'Signed collaboration agreement with Emirates NBD for fintech program', timestamp: new Date(Date.now() - 86400000).toISOString(), priority: 'high' },
      { id: 3, type: 'research_publication', title: 'Research Publication', description: 'Paper on "AI in UAE Education" accepted by IEEE Conference', timestamp: new Date(Date.now() - 172800000).toISOString(), priority: 'medium' },
      { id: 4, type: 'curriculum_update', title: 'Curriculum Enhancement', description: 'Updated Machine Learning course with latest industry requirements', timestamp: new Date(Date.now() - 259200000).toISOString(), priority: 'medium' },
    ]
  };

  const [dashboardData, setDashboardData] = useState<EducatorData>(defaultData);

  // Load dashboard data from API with safe merge
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const resp = await restClient.get('/api/educator/dashboard');
        if (resp.data?.success && resp.data?.data) {
          const api = resp.data.data;
          setDashboardData(prev => ({
            students: { ...prev.students, ...api.students },
            programs: { ...prev.programs, ...api.programs },
            outcomes: { ...prev.outcomes, ...api.outcomes },
            research: { ...prev.research, ...api.research },
            activity: api.activity?.length ? api.activity : prev.activity,
          }));
        }
      } catch (err) {
        console.warn('Educator dashboard API unavailable, using defaults:', err);
      } finally {
        setLoading(false);
      }
    };

    // Also try to load alerts for the activity feed
    const loadAlerts = async () => {
      try {
        const resp = await restClient.get('/api/educator/alerts');
        if (resp.data?.success && resp.data?.alerts?.length) {
          setDashboardData(prev => ({
            ...prev,
            activity: resp.data.alerts.map((a: any, i: number) => ({
              id: a.id || i + 1,
              type: a.type || 'curriculum_update',
              title: a.title || a.alert_type || 'Alert',
              description: a.message || a.description || '',
              timestamp: a.created_at || new Date().toISOString(),
              priority: a.priority || 'medium',
            })),
          }));
        }
      } catch { /* alerts are optional */ }
    };

    loadDashboardData();
    loadAlerts();

    // Load students list for Students tab
    const loadStudents = async () => {
      try {
        const resp = await restClient.get('/api/educator/students');
        if (resp.data?.success && resp.data?.students) {
          setStudentsList(resp.data.students);
        }
      } catch { /* fallback handled by empty default */ }
    };
    loadStudents();

    // Load analytics for Outcomes tab
    const loadAnalytics = async () => {
      try {
        const resp = await restClient.get('/api/educator/analytics/performance');
        if (resp.data?.success && resp.data?.analytics) {
          setAnalyticsData(resp.data.analytics);
        }
      } catch { /* optional */ }
    };
    loadAnalytics();
  }, []);

  // Dynamic educator name from auth
  const educatorName = user?.full_name && user.full_name !== 'New Member'
    ? user.full_name
    : t('Educator', 'المعلم');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 font-dubai" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <HybridGovernmentNavFixed
        showAuthButtons={true}
        onLanguageToggle={toggleLanguage}
        currentLanguage={language}
      />



      {/* Main Content */}
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-dubai-bold text-slate-900 mb-2">
                  {t('Educator Dashboard', 'لوحة تحكم المعلم')}
                </h1>
                <p className="text-slate-600 font-dubai-medium">
                  {t(`Welcome back, ${educatorName}`, `مرحباً بعودتك، ${educatorName}`)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-dubai-medium">
                  {t('Professor', 'أستاذ')}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-dubai-medium">
                  {t('AI Specialist', 'متخصص ذكاء اصطناعي')}
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 me-2" />
                  {t('Settings', 'الإعدادات')}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                <Plus className="h-4 w-4 me-2" />
                {t('Create Course', 'إنشاء دورة')}
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <Users className="h-4 w-4 me-2" />
                {t('Manage Students', 'إدارة الطلاب')}
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <Building className="h-4 w-4 me-2" />
                {t('Industry Partnerships', 'شراكات الصناعة')}
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <Download className="h-4 w-4 me-2" />
                {t('Export Reports', 'تصدير التقارير')}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <TabsList className="grid w-full grid-cols-8 bg-white shadow-sm">
              <TabsTrigger value="overview" className="font-dubai-medium">{t('Overview', 'نظرة عامة')}</TabsTrigger>
              <TabsTrigger value="students" className="font-dubai-medium">{t('Students', 'الطلاب')}</TabsTrigger>
              <TabsTrigger value="programs" className="font-dubai-medium">{t('Programs', 'البرامج')}</TabsTrigger>
              <TabsTrigger value="research" className="font-dubai-medium">{t('Research', 'البحث')}</TabsTrigger>
              <TabsTrigger value="outcomes" className="font-dubai-medium">{t('Outcomes', 'النتائج')}</TabsTrigger>
              <TabsTrigger value="scholarships" className="font-dubai-medium">{t('Scholarships', 'المنح الدراسية')}</TabsTrigger>
              <TabsTrigger value="approvals" className="font-dubai-medium">{t('Approvals', 'الموافقات')}</TabsTrigger>
              <TabsTrigger value="messages" className="font-dubai-medium">
                <MessageSquare className="h-4 w-4 me-1" />
                {t('Messages', 'الرسائل')}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">{t('Total Students', 'إجمالي الطلاب')}</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.students.totalEnrolled}</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      {dashboardData.students.activeStudents} {t('currently active', 'نشط حالياً')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">{t('Active Programs', 'البرامج النشطة')}</CardTitle>
                    <BookOpen className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.programs.activePrograms}</div>
                    <p className="text-xs text-slate-500 font-dubai-medium">
                      {dashboardData.programs.totalPrograms} {t('total programs', 'إجمالي البرامج')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">{t('Employment Rate', 'نسبة التوظيف')}</CardTitle>
                    <Briefcase className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.outcomes.employmentRate}%</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      {t('+3% from last year', '+3% عن العام الماضي')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">{t('Research Publications', 'الأبحاث المنشورة')}</CardTitle>
                    <FileText className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.research.publications}</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      {t('+8 this year', '+8 هذا العام')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Student Outcomes */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900 text-start">{t('Student Outcomes', 'نتائج الطلاب')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600 text-start">
                    {t('Key performance indicators for student success', 'مؤشرات الأداء الرئيسية لنجاح الطلاب')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-green-600">{dashboardData.outcomes.employmentRate}%</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">{t('Employment Rate', 'نسبة التوظيف')}</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-blue-600">AED {dashboardData.outcomes.averageSalary.toLocaleString()}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">{t('Average Salary', 'متوسط الراتب')}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-purple-600">{dashboardData.outcomes.skillsMatchRate}%</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">{t('Skills Match Rate', 'نسبة تطابق المهارات')}</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-orange-600">{dashboardData.outcomes.industryReadiness}%</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">{t('Industry Readiness', 'الجاهزية الصناعية')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Research & Industry Collaboration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-dubai-bold text-slate-900 text-start">{t('Research Activity', 'النشاط البحثي')}</CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-600 text-start">
                      {t('Current research projects and publications', 'المشاريع البحثية الحالية والمنشورات')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">{t('Ongoing Projects', 'المشاريع الجارية')}</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.research.ongoingProjects}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">{t('Active Grants', 'المنح النشطة')}</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.research.grants}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">{t('Collaborations', 'التعاونات')}</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.research.collaborations}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-dubai-bold text-slate-900 text-start">{t('Industry Partnerships', 'شراكات الصناعة')}</CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-600 text-start">
                      {t('Active collaborations with industry partners', 'التعاونات النشطة مع شركاء الصناعة')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">{t('Active Partnerships', 'الشراكات النشطة')}</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.programs.industryPartnerships}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">{t('Certification Programs', 'برامج الشهادات')}</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.programs.certificationPrograms}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">{t('Placement Rate', 'نسبة التوظيف')}</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.students.placementRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900 text-start">{t('Recent Activity', 'النشاط الأخير')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600 text-start">
                    {t('Latest updates from your educational activities', 'آخر التحديثات من أنشطتك التعليمية')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.activity.length > 0 ? (
                      dashboardData.activity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <div className="flex-shrink-0">
                            {activity.type === 'student_placement' && (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                            )}
                            {activity.type === 'industry_partnership' && (
                              <Building className="h-5 w-5 text-blue-500 mt-1" />
                            )}
                            {activity.type === 'research_publication' && (
                              <FileText className="h-5 w-5 text-purple-500 mt-1" />
                            )}
                            {activity.type === 'curriculum_update' && (
                              <BookOpen className="h-5 w-5 text-orange-500 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-dubai-medium text-slate-900">
                                {activity.title}
                              </p>
                              {activity.priority && (
                                <Badge
                                  variant={activity.priority === 'high' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {activity.priority}
                                </Badge>
                              )}
                            </div>
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
                      <p className="text-sm text-slate-500 font-dubai-medium">{t('No recent activity', 'لا يوجد نشاط حديث')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Students Tab */}
            <TabsContent value="students" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900 text-start">{t('Student Management', 'إدارة الطلاب')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600 text-start">
                    {t('Manage student enrollment and progress tracking', 'إدارة تسجيل الطلاب ومتابعة التقدم')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400`} />
                    <Input
                      placeholder={t('Search students by name or email...', 'ابحث عن الطلاب بالاسم أو البريد...')}
                      value={studentsSearch}
                      onChange={(e) => setStudentsSearch(e.target.value)}
                      className={`${isRTL ? 'pr-10' : 'pl-10'} font-dubai-medium`}
                    />
                  </div>
                  {(() => {
                    const filtered = studentsList.filter((s: any) => {
                      if (!studentsSearch) return true;
                      const q = studentsSearch.toLowerCase();
                      return (s.name || '').toLowerCase().includes(q)
                        || (s.email || '').toLowerCase().includes(q)
                        || (s.arabic_name || '').toLowerCase().includes(q);
                    });
                    return filtered.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500 font-dubai-medium">{studentsSearch ? t('No students match your search', 'لا يوجد طلاب مطابقون لبحثك') : t('No students found', 'لم يتم العثور على طلاب')}</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="ltr:text-left rtl:text-right py-3 px-4 font-dubai-medium text-slate-600">{t('Name', 'الاسم')}</th>
                              <th className="ltr:text-left rtl:text-right py-3 px-4 font-dubai-medium text-slate-600">{t('Status', 'الحالة')}</th>
                              <th className="ltr:text-left rtl:text-right py-3 px-4 font-dubai-medium text-slate-600">{t('GPA', 'المعدل')}</th>
                              <th className="ltr:text-left rtl:text-right py-3 px-4 font-dubai-medium text-slate-600">{t('Attendance', 'الحضور')}</th>
                              <th className="ltr:text-left rtl:text-right py-3 px-4 font-dubai-medium text-slate-600">{t('Performance', 'الأداء')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((s: any, i: number) => (
                              <tr key={s.student_id || i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                                      <span className="text-teal-700 font-dubai-bold text-xs">{(s.name || '?')[0]}</span>
                                    </div>
                                    <div>
                                      <p className="font-dubai-medium text-slate-900">{s.name}</p>
                                      <p className="text-xs text-slate-500">{s.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className={`text-xs ${s.status === 'active' ? 'bg-green-50 text-green-700 border-green-200'
                                    : s.status === 'graduated' ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                    {s.status}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 font-dubai-bold text-slate-900">{Number(s.gpa || 0).toFixed(2)}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <Progress value={Number(s.attendance_rate || 0)} className="h-2 w-20" />
                                    <span className="text-xs text-slate-600">{Number(s.attendance_rate || 0).toFixed(0)}%</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className={`text-xs ${s.performance_level === 'excellent' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : s.performance_level === 'good' ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : s.performance_level === 'satisfactory' ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {s.performance_level}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Programs Tab */}
            <TabsContent value="programs" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">{t('Program Management', 'إدارة البرامج')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    {t('Manage courses, curricula, and educational programs', 'إدارة الدورات والمناهج والبرامج التعليمية')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">{t('Program Management', 'إدارة البرامج')}</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">{t('Create and manage educational programs and curricula', 'إنشاء وإدارة البرامج التعليمية والمناهج')}</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      <Plus className="h-4 w-4 me-2" />
                      {t('Create New Program', 'إنشاء برنامج جديد')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Research Tab */}
            <TabsContent value="research" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">{t('Research & Publications', 'البحث والمنشورات')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    {t('Manage research projects, publications, and collaborations', 'إدارة المشاريع البحثية والمنشورات والتعاونات')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Lightbulb className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">{t('Research Management', 'إدارة البحث')}</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">{t('Track research projects, publications, and academic collaborations', 'متابعة المشاريع البحثية والمنشورات والتعاونات الأكاديمية')}</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      {t('View Research Portfolio', 'عرض محفظة البحث')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Outcomes Tab */}
            <TabsContent value="outcomes" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">{t('Student Outcomes & Analytics', 'نتائج الطلاب والتحليلات')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    {t('Track student success metrics and employment outcomes', 'متابعة مؤشرات نجاح الطلاب ونتائج التوظيف')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData ? (
                    <div className="space-y-6">
                      {/* Overview Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-dubai-bold text-blue-600">{analyticsData.overview?.total_students || 0}</div>
                          <p className="text-sm text-slate-600 font-dubai-medium">{t('Active Students', 'الطلاب النشطون')}</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-dubai-bold text-green-600">{analyticsData.overview?.average_gpa || 0}</div>
                          <p className="text-sm text-slate-600 font-dubai-medium">{t('Average GPA', 'متوسط المعدل')}</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-dubai-bold text-purple-600">{analyticsData.overview?.attendance_rate || 0}%</div>
                          <p className="text-sm text-slate-600 font-dubai-medium">{t('Attendance Rate', 'نسبة الحضور')}</p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-dubai-bold text-orange-600">{analyticsData.overview?.placement_success_rate || 85}%</div>
                          <p className="text-sm text-slate-600 font-dubai-medium">{t('Placement Rate', 'نسبة التوظيف')}</p>
                        </div>
                      </div>

                      {/* Performance Distribution */}
                      <div>
                        <h4 className="font-dubai-bold text-slate-900 mb-3">{t('Performance Distribution', 'توزيع الأداء')}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {Object.entries(analyticsData.performance_distribution || {}).map(([level, count]: [string, any]) => (
                            <div key={level} className="text-center p-3 bg-slate-50 rounded-lg">
                              <div className="text-xl font-dubai-bold text-slate-900">{count}</div>
                              <p className="text-xs text-slate-500 font-dubai-medium capitalize">{level.replace('_', ' ')}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Subject Performance */}
                      {analyticsData.subject_performance?.length > 0 && (
                        <div>
                          <h4 className="font-dubai-bold text-slate-900 mb-3">{t('Subject Performance', 'أداء المواد')}</h4>
                          <div className="space-y-3">
                            {analyticsData.subject_performance.map((sp: any) => (
                              <div key={sp.subject} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className={`font-dubai-medium text-slate-900 w-40 ${isRTL ? 'text-right' : 'text-left'}`}>{sp.subject}</span>
                                <div className="flex-1 mx-4">
                                  <Progress value={Number(sp.average_grade || 0)} className="h-2" />
                                </div>
                                <span className="text-sm font-dubai-bold text-slate-700 w-16 text-right">{sp.average_grade}%</span>
                                <Badge variant="outline" className="ms-2 text-xs bg-green-50 text-green-700">{sp.pass_rate}% {t('pass', 'نجاح')}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Emiratization Metrics */}
                      {analyticsData.emiratization_metrics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-teal-50 rounded-lg">
                            <div className="text-xl font-dubai-bold text-teal-700">{analyticsData.emiratization_metrics.emirati_students || 0}</div>
                            <p className="text-sm text-slate-600 font-dubai-medium">{t('Emirati Students', 'الطلاب الإماراتيون')}</p>
                          </div>
                          <div className="p-4 bg-teal-50 rounded-lg">
                            <div className="text-xl font-dubai-bold text-teal-700">{analyticsData.emiratization_metrics.emirati_placement_rate || 0}%</div>
                            <p className="text-sm text-slate-600 font-dubai-medium">{t('Emirati Placement Rate', 'نسبة توظيف الإماراتيين')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500 font-dubai-medium">{t('Loading analytics...', 'جاري تحميل التحليلات...')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scholarships Tab */}
            <TabsContent value="scholarships" className="space-y-6">
              <ScholarshipManagement />
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <Messages senderRole='training_provider' />
            </TabsContent>

            {/* Approvals Tab */}
            <TabsContent value="approvals" className="space-y-6">
              <EducatorApprovals />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EducatorDashboard;
