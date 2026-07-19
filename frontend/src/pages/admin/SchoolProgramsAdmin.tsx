// School Programs Admin Interface - Simplified Working Version
// KHDA Content Management System

import React, { useState } from 'react';
import { 
  Search, 
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
  Bell,
  FileText,
  Star,
  TrendingUp,
  Activity,
  Shield,
  Globe
} from 'lucide-react';
import HybridGovernmentNavFixed from '../../components/layout/HybridGovernmentNavFixed';

// Mock admin user
const mockAdminUser = {
  id: 'admin-001',
  name: { en: 'Dr. Amina Al Zahra', ar: 'د. آمنة الزهراء' },
  role: 'khda_director',
  department: 'KHDA Leadership'
};

// Mock programs data
const mockPrograms = [
  {
    id: 'prog-001',
    title: { en: 'Advanced STEM Innovation Program', ar: 'برنامج الابتكار المتقدم في العلوم والتكنولوجيا' },
    school: { name: { en: 'Dubai International Academy', ar: 'أكاديمية دبي الدولية' } },
    category: 'STEM',
    status: 'published',
    workflowStage: 'publication',
    submissionDate: '2024-01-15',
    lastModified: '2024-01-20'
  },
  {
    id: 'prog-002',
    title: { en: 'Creative Arts Excellence Program', ar: 'برنامج التميز في الفنون الإبداعية' },
    school: { name: { en: 'GEMS Wellington Academy', ar: 'أكاديمية جيمس ويلينغتون' } },
    category: 'Arts',
    status: 'under_review',
    workflowStage: 'educational_review',
    submissionDate: '2024-02-01',
    lastModified: '2024-02-05'
  },
  {
    id: 'prog-003',
    title: { en: 'Sports Leadership Academy', ar: 'أكاديمية القيادة الرياضية' },
    school: { name: { en: 'American School of Dubai', ar: 'المدرسة الأمريكية في دبي' } },
    category: 'Sports',
    status: 'draft',
    workflowStage: 'content_creation',
    submissionDate: '2024-02-10',
    lastModified: '2024-02-12'
  }
];

const SchoolProgramsAdmin: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>('en');
  const [activeTab, setActiveTab] = useState<'overview' | 'programs' | 'workflow'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleLanguageToggle = () => {
    setCurrentLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'draft': return <Edit className="w-4 h-4 text-yellow-600" />;
      case 'under_review': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      published: { en: 'Published', ar: 'منشور' },
      draft: { en: 'Draft', ar: 'مسودة' },
      under_review: { en: 'Under Review', ar: 'قيد المراجعة' },
      rejected: { en: 'Rejected', ar: 'مرفوض' }
    };
    return labels[status as keyof typeof labels]?.[currentLanguage] || status;
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
              <p className="text-3xl font-bold text-gray-900">24</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 me-1" />
            {currentLanguage === 'en' ? '+12% from last month' : '+12% من الشهر الماضي'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {currentLanguage === 'en' ? 'Published Programs' : 'البرامج المنشورة'}
              </p>
              <p className="text-3xl font-bold text-gray-900">18</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <Star className="w-4 h-4 me-1" />
            {currentLanguage === 'en' ? '94% approval rate' : 'معدل موافقة 94%'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {currentLanguage === 'en' ? 'Pending Reviews' : 'المراجعات المعلقة'}
              </p>
              <p className="text-3xl font-bold text-gray-900">6</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-600">
            <Activity className="w-4 h-4 me-1" />
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
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="p-2 bg-blue-100 rounded-full">
                <Bell className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {currentLanguage === 'en' 
                    ? 'New program submission awaiting educational review'
                    : 'تقديم برنامج جديد في انتظار المراجعة التعليمية'
                  }
                </p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
              <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                {currentLanguage === 'en' ? 'Review' : 'مراجعة'}
              </button>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {currentLanguage === 'en' 
                    ? 'STEM Innovation Program approved and published'
                    : 'تم الموافقة على برنامج الابتكار في العلوم ونشره'
                  }
                </p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
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
              <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={currentLanguage === 'en' ? 'Search programs...' : 'البحث في البرامج...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10 pe-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full sm:w-64"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">{currentLanguage === 'en' ? 'All Status' : 'جميع الحالات'}</option>
              <option value="published">{currentLanguage === 'en' ? 'Published' : 'منشور'}</option>
              <option value="draft">{currentLanguage === 'en' ? 'Draft' : 'مسودة'}</option>
              <option value="under_review">{currentLanguage === 'en' ? 'Under Review' : 'قيد المراجعة'}</option>
              <option value="rejected">{currentLanguage === 'en' ? 'Rejected' : 'مرفوض'}</option>
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
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'en' ? 'Program' : 'البرنامج'}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'en' ? 'School' : 'المدرسة'}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'en' ? 'Category' : 'الفئة'}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'en' ? 'Status' : 'الحالة'}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'en' ? 'Last Modified' : 'آخر تعديل'}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'en' ? 'Actions' : 'الإجراءات'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockPrograms.map((program) => (
                <tr key={program.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {program.title[currentLanguage]}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {program.school.name[currentLanguage]}
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
                      <span className="text-sm text-gray-900">
                        {getStatusLabel(program.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(program.lastModified).toLocaleDateString(currentLanguage === 'ar' ? 'ar-AE' : 'en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <button className="text-teal-600 hover:text-teal-900">
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
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentLanguage === 'en' ? 'Workflow Management' : 'إدارة سير العمل'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {currentLanguage === 'en' 
              ? 'Manage the 25-day KHDA approval process for school programs'
              : 'إدارة عملية الموافقة لمدة 25 يوماً من هيئة المعرفة للبرامج المدرسية'
            }
          </p>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {currentLanguage === 'en' 
                ? 'Workflow management interface will be displayed here'
                : 'ستظهر واجهة إدارة سير العمل هنا'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      <HybridGovernmentNavFixed 
        onLanguageToggle={handleLanguageToggle}
        currentLanguage={currentLanguage}
      />

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
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="text-end">
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
              { id: 'workflow', label: { en: 'Workflow', ar: 'سير العمل' }, icon: Activity }
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
      </div>
    </div>
  );
};

export default SchoolProgramsAdmin;
