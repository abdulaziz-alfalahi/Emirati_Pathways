// School Programs Admin Interface
// Comprehensive admin dashboard for KHDA content management with role-based access

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  BarChart3,
  Settings,
  Download,
  Upload,
  Bell,
  Calendar,
  FileText,
  Star,
  TrendingUp,
  Activity,
  Shield,
  Globe
} from 'lucide-react';
import HybridGovernmentNavFixed from '../../components/layout/HybridGovernmentNavFixed';
import { schoolProgramsService } from '../../services/schoolProgramsService';
import { contentWorkflowService } from '../../services/contentWorkflowService';
import { SchoolProgram, WorkflowStage, ProgramStatus, UserRole } from '../../types/schoolPrograms';

interface AdminUser {
  id: string;
  name: { en: string; ar: string };
  role: UserRole;
  department: string;
  permissions: string[];
}

// Mock admin user for demonstration
const mockAdminUser: AdminUser = {
  id: 'admin-001',
  name: { en: 'Dr. Amina Al Zahra', ar: 'د. آمنة الزهراء' },
  role: 'khda_director',
  department: 'KHDA Leadership',
  permissions: ['approve_final', 'view_analytics', 'manage_users', 'export_data']
};

const SchoolProgramsAdmin: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>('en');
  const [activeTab, setActiveTab] = useState<'overview' | 'programs' | 'workflow' | 'analytics' | 'users' | 'settings'>('overview');
  const [programs, setPrograms] = useState<SchoolProgram[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<SchoolProgram[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProgramStatus | 'all'>('all');
  const [workflowFilter, setWorkflowFilter] = useState<WorkflowStage | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<SchoolProgram | null>(null);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalPrograms: 0,
    publishedPrograms: 0,
    pendingReviews: 0,
    averageApprovalTime: 0,
    userSatisfaction: 0,
    monthlySubmissions: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    filterPrograms();
  }, [programs, searchQuery, statusFilter, workflowFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load programs
      const programsResponse = await schoolProgramsService.getPrograms({ limit: 100 });
      setPrograms(programsResponse.programs);
      
      // Load pending reviews
      const reviews = await contentWorkflowService.getPendingReviews(mockAdminUser.id);
      setPendingReviews(reviews);
      
      // Calculate dashboard statistics
      const stats = {
        totalPrograms: programsResponse.programs.length,
        publishedPrograms: programsResponse.programs.filter(p => p.status === 'published').length,
        pendingReviews: reviews.length,
        averageApprovalTime: 18, // Mock data
        userSatisfaction: 4.6,
        monthlySubmissions: 24
      };
      setDashboardStats(stats);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPrograms = () => {
    let filtered = [...programs];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(program => 
        program.title.en.toLowerCase().includes(query) ||
        program.title.ar.includes(query) ||
        program.school.name.en.toLowerCase().includes(query) ||
        program.school.name.ar.includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(program => program.status === statusFilter);
    }
    
    // Apply workflow filter
    if (workflowFilter !== 'all') {
      filtered = filtered.filter(program => program.workflowStage === workflowFilter);
    }
    
    setFilteredPrograms(filtered);
  };

  const getStatusIcon = (status: ProgramStatus) => {
    switch (status) {
      case 'published': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'draft': return <Edit className="w-4 h-4 text-yellow-600" />;
      case 'under_review': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getWorkflowStageLabel = (stage: WorkflowStage) => {
    const labels = {
      content_creation: { en: 'Content Creation', ar: 'إنشاء المحتوى' },
      submission: { en: 'Submission', ar: 'التقديم' },
      technical_review: { en: 'Technical Review', ar: 'المراجعة التقنية' },
      educational_review: { en: 'Educational Review', ar: 'المراجعة التعليمية' },
      policy_review: { en: 'Policy Review', ar: 'مراجعة السياسات' },
      final_approval: { en: 'Final Approval', ar: 'الموافقة النهائية' },
      staging: { en: 'Staging', ar: 'التجهيز' },
      publication: { en: 'Publication', ar: 'النشر' },
      maintenance: { en: 'Maintenance', ar: 'الصيانة' }
    };
    return labels[stage][currentLanguage];
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {currentLanguage === 'en' ? 'Total Programs' : 'إجمالي البرامج'}
              </p>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalPrograms}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            {currentLanguage === 'en' ? '+12% from last month' : '+12% من الشهر الماضي'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {currentLanguage === 'en' ? 'Published Programs' : 'البرامج المنشورة'}
              </p>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.publishedPrograms}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <Star className="w-4 h-4 mr-1" />
            {currentLanguage === 'en' ? '94% approval rate' : 'معدل موافقة 94%'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {currentLanguage === 'en' ? 'Pending Reviews' : 'المراجعات المعلقة'}
              </p>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.pendingReviews}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-600">
            <Activity className="w-4 h-4 mr-1" />
            {currentLanguage === 'en' ? 'Avg. 18 days approval' : 'متوسط 18 يوم للموافقة'}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentLanguage === 'en' ? 'Recent Activity' : 'النشاط الأخير'}
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {pendingReviews.slice(0, 5).map((review, index) => (
              <div key={index} className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {currentLanguage === 'en' 
                      ? `New program submission awaiting ${getWorkflowStageLabel(review.currentStage)}`
                      : `تقديم برنامج جديد في انتظار ${getWorkflowStageLabel(review.currentStage)}`
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(review.submissionDate).toLocaleDateString(currentLanguage === 'ar' ? 'ar-AE' : 'en-US')}
                  </p>
                </div>
                <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                  {currentLanguage === 'en' ? 'Review' : 'مراجعة'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentLanguage === 'en' ? 'Quick Actions' : 'الإجراءات السريعة'}
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center space-x-3 rtl:space-x-reverse p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Plus className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-medium text-gray-900">
                {currentLanguage === 'en' ? 'Add Program' : 'إضافة برنامج'}
              </span>
            </button>
            
            <button className="flex items-center space-x-3 rtl:space-x-reverse p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-medium text-gray-900">
                {currentLanguage === 'en' ? 'Export Data' : 'تصدير البيانات'}
              </span>
            </button>
            
            <button className="flex items-center space-x-3 rtl:space-x-reverse p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-medium text-gray-900">
                {currentLanguage === 'en' ? 'View Analytics' : 'عرض التحليلات'}
              </span>
            </button>
            
            <button className="flex items-center space-x-3 rtl:space-x-reverse p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Settings className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-medium text-gray-900">
                {currentLanguage === 'en' ? 'Settings' : 'الإعدادات'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProgramsTab = () => (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 rtl:space-x-reverse">
            <div className="relative">
              <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={currentLanguage === 'en' ? 'Search programs...' : 'البحث في البرامج...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full sm:w-64"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProgramStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">{currentLanguage === 'en' ? 'All Status' : 'جميع الحالات'}</option>
              <option value="published">{currentLanguage === 'en' ? 'Published' : 'منشور'}</option>
              <option value="draft">{currentLanguage === 'en' ? 'Draft' : 'مسودة'}</option>
              <option value="under_review">{currentLanguage === 'en' ? 'Under Review' : 'قيد المراجعة'}</option>
              <option value="rejected">{currentLanguage === 'en' ? 'Rejected' : 'مرفوض'}</option>
            </select>
            
            <select
              value={workflowFilter}
              onChange={(e) => setWorkflowFilter(e.target.value as WorkflowStage | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">{currentLanguage === 'en' ? 'All Stages' : 'جميع المراحل'}</option>
              <option value="technical_review">{currentLanguage === 'en' ? 'Technical Review' : 'المراجعة التقنية'}</option>
              <option value="educational_review">{currentLanguage === 'en' ? 'Educational Review' : 'المراجعة التعليمية'}</option>
              <option value="policy_review">{currentLanguage === 'en' ? 'Policy Review' : 'مراجعة السياسات'}</option>
              <option value="final_approval">{currentLanguage === 'en' ? 'Final Approval' : 'الموافقة النهائية'}</option>
            </select>
          </div>
          
          <button className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>{currentLanguage === 'en' ? 'Add Program' : 'إضافة برنامج'}</span>
          </button>
        </div>
      </div>

      {/* Programs Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'en' ? 'Program' : 'البرنامج'}
                </th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'en' ? 'School' : 'المدرسة'}
                </th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'en' ? 'Category' : 'الفئة'}
                </th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'en' ? 'Status' : 'الحالة'}
                </th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'en' ? 'Workflow Stage' : 'مرحلة العمل'}
                </th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'en' ? 'Last Updated' : 'آخر تحديث'}
                </th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'en' ? 'Actions' : 'الإجراءات'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPrograms.map((program) => (
                <tr key={program.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {program.title[currentLanguage]}
                      </div>
                      <div className="text-sm text-gray-500">
                        {program.targetAge.min}-{program.targetAge.max} years
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {program.school.name[currentLanguage]}
                    </div>
                    <div className="text-sm text-gray-500">
                      {program.school.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {program.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {getStatusIcon(program.status)}
                      <span className="text-sm text-gray-900 capitalize">
                        {program.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {getWorkflowStageLabel(program.workflowStage)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(program.updatedAt).toLocaleDateString(currentLanguage === 'ar' ? 'ar-AE' : 'en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <button 
                        onClick={() => {
                          setSelectedProgram(program);
                          setShowProgramModal(true);
                        }}
                        className="text-teal-600 hover:text-teal-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderWorkflowTab = () => (
    <div className="space-y-6">
      {/* Workflow Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {currentLanguage === 'en' ? 'KHDA Approval Workflow' : 'سير عمل موافقة هيئة المعرفة'}
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-9 gap-4">
          {Object.entries(contentWorkflowService.getWorkflowConfig().stages).map(([stage, config], index) => (
            <div key={stage} className="text-center">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                index < 5 ? 'bg-green-500' : index === 5 ? 'bg-yellow-500' : 'bg-gray-300'
              }`}>
                {index + 1}
              </div>
              <div className="mt-2">
                <div className="text-xs font-medium text-gray-900">
                  {config.name[currentLanguage]}
                </div>
                <div className="text-xs text-gray-500">
                  {config.duration > 0 ? `${config.duration} ${currentLanguage === 'en' ? 'days' : 'أيام'}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Reviews */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentLanguage === 'en' ? 'Pending Reviews' : 'المراجعات المعلقة'}
          </h3>
        </div>
        <div className="p-6">
          {pendingReviews.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">
                {currentLanguage === 'en' ? 'No pending reviews' : 'لا توجد مراجعات معلقة'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((review, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {currentLanguage === 'en' ? `Program ID: ${review.programId}` : `معرف البرنامج: ${review.programId}`}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {currentLanguage === 'en' ? 'Current Stage:' : 'المرحلة الحالية:'} {getWorkflowStageLabel(review.currentStage)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {currentLanguage === 'en' ? 'Submitted:' : 'تم التقديم:'} {new Date(review.submissionDate).toLocaleDateString(currentLanguage === 'ar' ? 'ar-AE' : 'en-US')}
                      </p>
                    </div>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                        {currentLanguage === 'en' ? 'Approve' : 'موافقة'}
                      </button>
                      <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                        {currentLanguage === 'en' ? 'Reject' : 'رفض'}
                      </button>
                      <button className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700">
                        {currentLanguage === 'en' ? 'Request Revision' : 'طلب مراجعة'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <HybridGovernmentNavFixed>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {currentLanguage === 'en' ? 'Loading admin dashboard...' : 'تحميل لوحة الإدارة...'}
            </p>
          </div>
        </div>
      </HybridGovernmentNavFixed>
    );
  }

  return (
    <HybridGovernmentNavFixed>
      <div className={`min-h-screen bg-gray-50 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <Shield className="w-8 h-8 text-teal-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {currentLanguage === 'en' ? 'School Programs Admin' : 'إدارة البرامج المدرسية'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {currentLanguage === 'en' ? 'KHDA Content Management System' : 'نظام إدارة المحتوى - هيئة المعرفة'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <button
                  onClick={() => setCurrentLanguage(currentLanguage === 'en' ? 'ar' : 'en')}
                  className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  <Globe className="w-4 h-4" />
                  <span>{currentLanguage === 'en' ? 'العربية' : 'English'}</span>
                </button>
                
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="text-right rtl:text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {mockAdminUser.name[currentLanguage]}
                    </p>
                    <p className="text-xs text-gray-500">
                      {mockAdminUser.department}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {mockAdminUser.name.en.charAt(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8 rtl:space-x-reverse">
              {[
                { id: 'overview', label: { en: 'Overview', ar: 'نظرة عامة' }, icon: BarChart3 },
                { id: 'programs', label: { en: 'Programs', ar: 'البرامج' }, icon: FileText },
                { id: 'workflow', label: { en: 'Workflow', ar: 'سير العمل' }, icon: Activity },
                { id: 'analytics', label: { en: 'Analytics', ar: 'التحليلات' }, icon: TrendingUp },
                { id: 'users', label: { en: 'Users', ar: 'المستخدمون' }, icon: Users },
                { id: 'settings', label: { en: 'Settings', ar: 'الإعدادات' }, icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 rtl:space-x-reverse py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label[currentLanguage]}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'programs' && renderProgramsTab()}
          {activeTab === 'workflow' && renderWorkflowTab()}
          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {currentLanguage === 'en' ? 'Analytics dashboard coming soon' : 'لوحة التحليلات قريباً'}
              </p>
            </div>
          )}
          {activeTab === 'users' && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {currentLanguage === 'en' ? 'User management coming soon' : 'إدارة المستخدمين قريباً'}
              </p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {currentLanguage === 'en' ? 'Settings panel coming soon' : 'لوحة الإعدادات قريباً'}
              </p>
            </div>
          )}
        </div>

        {/* Program Detail Modal */}
        {showProgramModal && selectedProgram && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedProgram.title[currentLanguage]}
                  </h2>
                  <button
                    onClick={() => setShowProgramModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {currentLanguage === 'en' ? 'Program Details' : 'تفاصيل البرنامج'}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">School:</span> {selectedProgram.school.name[currentLanguage]}</p>
                      <p><span className="font-medium">Category:</span> {selectedProgram.category}</p>
                      <p><span className="font-medium">Duration:</span> {selectedProgram.duration.value} {selectedProgram.duration.unit}</p>
                      <p><span className="font-medium">Age Range:</span> {selectedProgram.targetAge.min}-{selectedProgram.targetAge.max} years</p>
                      <p><span className="font-medium">Capacity:</span> {selectedProgram.capacity.total} students</p>
                      <p><span className="font-medium">Available:</span> {selectedProgram.capacity.available} spots</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {currentLanguage === 'en' ? 'Success Metrics' : 'مقاييس النجاح'}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Graduation Rate:</span> {selectedProgram.successMetrics.graduationRate}%</p>
                      <p><span className="font-medium">Employment Rate:</span> {selectedProgram.successMetrics.employmentRate}%</p>
                      <p><span className="font-medium">Satisfaction Score:</span> {selectedProgram.successMetrics.satisfactionScore}/5.0</p>
                      <p><span className="font-medium">Industry Partnerships:</span> {selectedProgram.successMetrics.industryPartnerships}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {currentLanguage === 'en' ? 'Description' : 'الوصف'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedProgram.description[currentLanguage]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </HybridGovernmentNavFixed>
  );
};

export default SchoolProgramsAdmin;
