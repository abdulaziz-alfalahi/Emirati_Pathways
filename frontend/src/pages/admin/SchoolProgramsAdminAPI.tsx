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
  Calendar,
  X
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
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    titleEn: '',
    titleAr: '',
    schoolId: '',
    category: '',
    status: 'draft',
    descriptionEn: '',
    descriptionAr: '',
    minAge: '',
    maxAge: '',
    capacity: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        
        // Load schools for the dropdown
        try {
          console.log('Loading schools from API...');
          const schoolsResponse = await fetch('http://localhost:5001/api/schools');
          console.log('Schools response status:', schoolsResponse.status);
          
          if (schoolsResponse.ok) {
            const schoolsData = await schoolsResponse.json();
            console.log('Schools data received:', schoolsData);
            setSchools(schoolsData);
          } else {
            console.error('Schools API response not ok:', schoolsResponse.status);
            throw new Error('Schools API failed');
          }
        } catch (schoolError) {
          console.error('Error loading schools:', schoolError);
          // Fallback to hardcoded schools if API fails
          const fallbackSchools = [
            { id: '1', name_en: 'Dubai International Academy', name_ar: 'أكاديمية دبي الدولية' },
            { id: '2', name_en: 'GEMS Wellington Academy', name_ar: 'أكاديمية جيمس ويلينغتون' },
            { id: '3', name_en: 'American School of Dubai', name_ar: 'المدرسة الأمريكية في دبي' }
          ];
          console.log('Using fallback schools:', fallbackSchools);
          setSchools(fallbackSchools);
        }
        
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      titleEn: '',
      titleAr: '',
      schoolId: '',
      category: '',
      status: 'draft',
      descriptionEn: '',
      descriptionAr: '',
      minAge: '',
      maxAge: '',
      capacity: ''
    });
  };

  const handleSubmitProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create program data object
      const programData = {
        title_en: formData.titleEn,
        title_ar: formData.titleAr || formData.titleEn, // Fallback to English if Arabic not provided
        school_id: formData.schoolId,
        category: formData.category,
        status: formData.status,
        description_en: formData.descriptionEn,
        description_ar: formData.descriptionAr || formData.descriptionEn,
        target_age_min: parseInt(formData.minAge) || 5,
        target_age_max: parseInt(formData.maxAge) || 18,
        capacity_total: parseInt(formData.capacity) || 50,
        capacity_available: parseInt(formData.capacity) || 50,
        fees_amount: 0,
        fees_currency: 'AED'
      };

      // Send POST request to API
      const response = await fetch('http://localhost:5001/api/school-programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(programData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Success - reload programs and close modal
      alert(currentLanguage === 'en' ? 'Program created successfully!' : 'تم إنشاء البرنامج بنجاح!');
      
      // Reload programs list
      const updatedResponse = await schoolProgramsAPIService.getPrograms({});
      setPrograms(updatedResponse.programs);
      
      // Update dashboard stats
      const stats = await schoolProgramsAPIService.getAnalytics();
      setDashboardStats(stats);
      
      // Close modal and reset form
      setShowAddProgramModal(false);
      resetForm();

    } catch (error) {
      console.error('Error creating program:', error);
      alert(currentLanguage === 'en' 
        ? 'Error creating program. Please try again.' 
        : 'خطأ في إنشاء البرنامج. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
                <button 
                  onClick={() => setShowAddProgramModal(true)}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center space-x-2"
                >
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

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {currentLanguage === 'en' ? 'Program Analytics' : 'تحليلات البرامج'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {currentLanguage === 'en' ? 'Category Distribution' : 'توزيع الفئات'}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">STEM</span>
                      <span className="text-sm font-medium">40%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Arts</span>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Sports</span>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Languages</span>
                      <span className="text-sm font-medium">15%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {currentLanguage === 'en' ? 'Monthly Trends' : 'الاتجاهات الشهرية'}
                  </h3>
                  <div className="text-center text-gray-500">
                    <BarChart3 className="mx-auto h-8 w-8 mb-2" />
                    <p className="text-sm">{currentLanguage === 'en' ? 'Chart coming soon' : 'الرسم البياني قريباً'}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {currentLanguage === 'en' ? 'Performance Metrics' : 'مقاييس الأداء'}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{currentLanguage === 'en' ? 'Avg. Rating' : 'التقييم المتوسط'}</span>
                      <span className="text-sm font-medium">4.5/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{currentLanguage === 'en' ? 'Completion Rate' : 'معدل الإنجاز'}</span>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {currentLanguage === 'en' ? 'User Management' : 'إدارة المستخدمين'}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">KHDA Staff</p>
                    <p className="text-sm text-gray-500">Content reviewers and approvers</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">12 users</span>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">School Administrators</p>
                    <p className="text-sm text-gray-500">Program creators and managers</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">45 users</span>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Content Managers</p>
                    <p className="text-sm text-gray-500">Content editors and coordinators</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">8 users</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {currentLanguage === 'en' ? 'System Settings' : 'إعدادات النظام'}
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {currentLanguage === 'en' ? 'Workflow Settings' : 'إعدادات سير العمل'}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {currentLanguage === 'en' ? 'Auto-approval for minor edits' : 'الموافقة التلقائية للتعديلات البسيطة'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {currentLanguage === 'en' ? 'Automatically approve minor content changes' : 'الموافقة التلقائية على تغييرات المحتوى البسيطة'}
                      </p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {currentLanguage === 'en' ? 'Email notifications' : 'إشعارات البريد الإلكتروني'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {currentLanguage === 'en' ? 'Send email updates for workflow changes' : 'إرسال تحديثات البريد الإلكتروني لتغييرات سير العمل'}
                      </p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-teal-600" defaultChecked />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {currentLanguage === 'en' ? 'Content Settings' : 'إعدادات المحتوى'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {currentLanguage === 'en' ? 'Default program duration' : 'مدة البرنامج الافتراضية'}
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                      <option>1 year</option>
                      <option>2 years</option>
                      <option>3 years</option>
                      <option>4 years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {currentLanguage === 'en' ? 'Maximum program capacity' : 'الحد الأقصى لسعة البرنامج'}
                    </label>
                    <input 
                      type="number" 
                      defaultValue="200"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Program Modal */}
      {showAddProgramModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {currentLanguage === 'en' ? 'Add New Program' : 'إضافة برنامج جديد'}
                </h3>
                <button
                  onClick={() => setShowAddProgramModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitProgram} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {currentLanguage === 'en' ? 'Program Title (English)' : 'عنوان البرنامج (إنجليزي)'}
                    </label>
                    <input
                      type="text"
                      name="titleEn"
                      value={formData.titleEn}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder={currentLanguage === 'en' ? 'Enter program title...' : 'أدخل عنوان البرنامج...'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {currentLanguage === 'en' ? 'Program Title (Arabic)' : 'عنوان البرنامج (عربي)'}
                    </label>
                    <input
                      type="text"
                      name="titleAr"
                      value={formData.titleAr}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder={currentLanguage === 'en' ? 'Enter Arabic title...' : 'أدخل العنوان العربي...'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {currentLanguage === 'en' ? 'School' : 'المدرسة'}
                  </label>
                  <select 
                    name="schoolId"
                    value={formData.schoolId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">{currentLanguage === 'en' ? 'Select a school...' : 'اختر مدرسة...'}</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>
                        {currentLanguage === 'en' ? school.name_en : school.name_ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {currentLanguage === 'en' ? 'Category' : 'الفئة'}
                    </label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">{currentLanguage === 'en' ? 'Select category...' : 'اختر الفئة...'}</option>
                      <option value="STEM">STEM</option>
                      <option value="Arts">Arts</option>
                      <option value="Sports">Sports</option>
                      <option value="Languages">Languages</option>
                      <option value="Business">Business</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {currentLanguage === 'en' ? 'Status' : 'الحالة'}
                    </label>
                    <select 
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="draft">{currentLanguage === 'en' ? 'Draft' : 'مسودة'}</option>
                      <option value="under_review">{currentLanguage === 'en' ? 'Under Review' : 'قيد المراجعة'}</option>
                      <option value="published">{currentLanguage === 'en' ? 'Published' : 'منشور'}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {currentLanguage === 'en' ? 'Description (English)' : 'الوصف (إنجليزي)'}
                  </label>
                  <textarea
                    name="descriptionEn"
                    value={formData.descriptionEn}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder={currentLanguage === 'en' ? 'Enter program description...' : 'أدخل وصف البرنامج...'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {currentLanguage === 'en' ? 'Description (Arabic)' : 'الوصف (عربي)'}
                  </label>
                  <textarea
                    name="descriptionAr"
                    value={formData.descriptionAr}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder={currentLanguage === 'en' ? 'Enter Arabic description...' : 'أدخل الوصف العربي...'}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {currentLanguage === 'en' ? 'Min Age' : 'العمر الأدنى'}
                    </label>
                    <input
                      type="number"
                      name="minAge"
                      value={formData.minAge}
                      onChange={handleInputChange}
                      min="5"
                      max="18"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {currentLanguage === 'en' ? 'Max Age' : 'العمر الأقصى'}
                    </label>
                    <input
                      type="number"
                      name="maxAge"
                      value={formData.maxAge}
                      onChange={handleInputChange}
                      min="5"
                      max="18"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {currentLanguage === 'en' ? 'Capacity' : 'السعة'}
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProgramModal(false);
                      resetForm();
                    }}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    {currentLanguage === 'en' ? 'Cancel' : 'إلغاء'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    <span>
                      {isSubmitting 
                        ? (currentLanguage === 'en' ? 'Creating...' : 'جاري الإنشاء...')
                        : (currentLanguage === 'en' ? 'Create Program' : 'إنشاء البرنامج')
                      }
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolProgramsAdminAPI;
