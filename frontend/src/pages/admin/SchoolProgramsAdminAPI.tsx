import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Upload,
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  BarChart3,
  FileText,
  Calendar
} from 'lucide-react';
import HybridGovernmentNavFixed from '../../components/layout/HybridGovernmentNavFixed';
import { schoolProgramsAPIService } from '../../services/schoolProgramsServiceAPI';

const SchoolProgramsAdminAPI: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>('en');
  const [activeTab, setActiveTab] = useState<'overview' | 'programs' | 'workflow' | 'analytics' | 'users' | 'settings'>('overview');
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dashboardStats, setDashboardStats] = useState<any>({});

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load dashboard stats
        const stats = await schoolProgramsAPIService.getAnalytics();
        setDashboardStats(stats);
        
        // Load programs
        const response = await schoolProgramsAPIService.getPrograms({});
        setPrograms(response.programs);
        
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLanguageToggle = () => {
    setCurrentLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = searchQuery === '' || 
      program.title?.en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.school?.name?.en?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || program.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HybridGovernmentNavFixed 
          onLanguageToggle={handleLanguageToggle}
          currentLanguage={currentLanguage}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      <HybridGovernmentNavFixed 
        onLanguageToggle={handleLanguageToggle}
        currentLanguage={currentLanguage}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {currentLanguage === 'en' ? 'School Programs Administration' : 'إدارة البرامج المدرسية'}
            </h1>
            <p className="mt-2 text-gray-600">
              {currentLanguage === 'en' 
                ? 'KHDA Content Management System for Dubai School Programs'
                : 'نظام إدارة المحتوى لهيئة المعرفة للبرامج المدرسية في دبي'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', name: { en: 'Overview', ar: 'نظرة عامة' }, icon: BarChart3 },
              { id: 'programs', name: { en: 'Programs', ar: 'البرامج' }, icon: BookOpen },
              { id: 'workflow', name: { en: 'Workflow', ar: 'سير العمل' }, icon: Clock },
              { id: 'analytics', name: { en: 'Analytics', ar: 'التحليلات' }, icon: TrendingUp },
              { id: 'users', name: { en: 'Users', ar: 'المستخدمون' }, icon: Users },
              { id: 'settings', name: { en: 'Settings', ar: 'الإعدادات' }, icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name[currentLanguage]}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-8 w-8 text-teal-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {currentLanguage === 'en' ? 'Total Programs' : 'إجمالي البرامج'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardStats.totalPrograms || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {currentLanguage === 'en' ? 'Published Programs' : 'البرامج المنشورة'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardStats.publishedPrograms || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {currentLanguage === 'en' ? 'Pending Reviews' : 'المراجعات المعلقة'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardStats.underReviewPrograms || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {currentLanguage === 'en' ? 'Approval Rate' : 'معدل الموافقة'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardStats.publishedPrograms && dashboardStats.totalPrograms 
                          ? Math.round((dashboardStats.publishedPrograms / dashboardStats.totalPrograms) * 100)
                          : 0
                        }%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {currentLanguage === 'en' ? 'Recent Activity' : 'النشاط الأخير'}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-gray-600">
                      {currentLanguage === 'en' 
                        ? 'Advanced STEM Innovation Program published'
                        : 'تم نشر برنامج الابتكار المتقدم في العلوم والتكنولوجيا'
                      }
                    </span>
                    <span className="text-xs text-gray-400">2 hours ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm text-gray-600">
                      {currentLanguage === 'en' 
                        ? 'Creative Arts Program pending review'
                        : 'برنامج الفنون الإبداعية في انتظار المراجعة'
                      }
                    </span>
                    <span className="text-xs text-gray-400">4 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="space-y-6">
            {/* Programs Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentLanguage === 'en' ? 'Programs Management' : 'إدارة البرامج'}
                </h2>
                <p className="text-gray-600">
                  {currentLanguage === 'en' 
                    ? 'Manage school programs and their approval workflow'
                    : 'إدارة البرامج المدرسية وسير عمل الموافقة عليها'
                  }
                </p>
              </div>
              <div className="flex space-x-3">
                <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>{currentLanguage === 'en' ? 'Add Program' : 'إضافة برنامج'}</span>
                </button>
                <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>{currentLanguage === 'en' ? 'Export' : 'تصدير'}</span>
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder={currentLanguage === 'en' ? 'Search programs...' : 'البحث في البرامج...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="all">{currentLanguage === 'en' ? 'All Status' : 'جميع الحالات'}</option>
                    <option value="draft">{currentLanguage === 'en' ? 'Draft' : 'مسودة'}</option>
                    <option value="under_review">{currentLanguage === 'en' ? 'Under Review' : 'قيد المراجعة'}</option>
                    <option value="published">{currentLanguage === 'en' ? 'Published' : 'منشور'}</option>
                    <option value="rejected">{currentLanguage === 'en' ? 'Rejected' : 'مرفوض'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Programs Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLanguage === 'en' ? 'Program' : 'البرنامج'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLanguage === 'en' ? 'School' : 'المدرسة'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLanguage === 'en' ? 'Category' : 'الفئة'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLanguage === 'en' ? 'Status' : 'الحالة'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLanguage === 'en' ? 'Last Modified' : 'آخر تعديل'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                            {program.title?.en || 'Untitled Program'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {program.category}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {program.school?.name?.en || 'Unknown School'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {program.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          program.status === 'published' ? 'bg-green-100 text-green-800' :
                          program.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                          program.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {program.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {program.updatedAt ? new Date(program.updatedAt).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-teal-600 hover:text-teal-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-blue-600 hover:text-blue-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredPrograms.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {currentLanguage === 'en' ? 'No programs found' : 'لم يتم العثور على برامج'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {currentLanguage === 'en' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'حاول تعديل معايير البحث أو الفلترة'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'workflow' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {currentLanguage === 'en' ? 'KHDA Workflow Management' : 'إدارة سير عمل هيئة المعرفة'}
            </h2>
            <p className="text-gray-600">
              {currentLanguage === 'en' 
                ? 'Manage the 25-day approval process for school programs'
                : 'إدارة عملية الموافقة لمدة 25 يوماً للبرامج المدرسية'
              }
            </p>
            <div className="mt-8 text-center text-gray-500">
              <Clock className="mx-auto h-12 w-12 mb-4" />
              <p>{currentLanguage === 'en' ? 'Workflow management interface coming soon' : 'واجهة إدارة سير العمل قريباً'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolProgramsAdminAPI;
