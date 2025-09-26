// School Programs Page
// Comprehensive user interface with search, filtering, and interactive features

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Calendar, 
  BookOpen, 
  Award, 
  ChevronDown, 
  ChevronUp,
  Heart,
  Share2,
  ExternalLink,
  Play,
  Download,
  Phone,
  Mail,
  Globe,
  Eye,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Grid,
  List,
  SlidersHorizontal,
  X
} from 'lucide-react';
import HybridGovernmentNavFixed from '../components/layout/HybridGovernmentNavFixed';
import { schoolProgramsService } from '../services/schoolProgramsService';
import { SchoolProgram, ProgramFilters, SearchParams } from '../types/schoolPrograms';

const SchoolProgramsPage: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>('en');
  const [programs, setPrograms] = useState<SchoolProgram[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<SchoolProgram[]>([]);
  const [featuredPrograms, setFeaturedPrograms] = useState<SchoolProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSchoolType, setSelectedSchoolType] = useState<string>('all');
  const [ageRange, setAgeRange] = useState({ min: 10, max: 18 });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'name' | 'date' | 'rating' | 'fees'>('relevance');
  const [selectedProgram, setSelectedProgram] = useState<SchoolProgram | null>(null);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);

  const programsPerPage = 12;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    searchPrograms();
  }, [searchQuery, selectedCategory, selectedSchoolType, ageRange, sortBy, currentPage]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load featured programs
      const featured = await schoolProgramsService.getFeaturedPrograms(3);
      setFeaturedPrograms(featured);
      
      // Load categories
      const categoriesData = await schoolProgramsService.getCategories();
      setCategories(categoriesData);
      
      // Load schools
      const schoolsData = await schoolProgramsService.getSchools();
      setSchools(schoolsData);
      
      // Load initial programs
      await searchPrograms();
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchPrograms = async () => {
    try {
      const filters: ProgramFilters = {};
      
      if (selectedCategory !== 'all') {
        filters.category = [selectedCategory as any];
      }
      
      if (selectedSchoolType !== 'all') {
        filters.schoolType = [selectedSchoolType as any];
      }
      
      filters.ageRange = ageRange;

      const searchParams: SearchParams = {
        query: searchQuery,
        filters,
        sortBy,
        sortOrder: 'desc',
        page: currentPage,
        limit: programsPerPage
      };

      const response = await schoolProgramsService.getPrograms(searchParams);
      setPrograms(response.programs);
      setFilteredPrograms(response.programs);
      setTotalPrograms(response.total);
      
    } catch (error) {
      console.error('Error searching programs:', error);
    }
  };

  const toggleFavorite = (programId: string) => {
    setFavorites(prev => 
      prev.includes(programId) 
        ? prev.filter(id => id !== programId)
        : [...prev, programId]
    );
  };

  const openProgramModal = (program: SchoolProgram) => {
    setSelectedProgram(program);
    setShowProgramModal(true);
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, { en: string; ar: string }> = {
      stem: { en: 'STEM & Technology', ar: 'العلوم والتكنولوجيا' },
      arts: { en: 'Arts & Culture', ar: 'الفنون والثقافة' },
      sports: { en: 'Sports & Athletics', ar: 'الرياضة والألعاب الرياضية' },
      language: { en: 'Languages', ar: 'اللغات' },
      vocational: { en: 'Vocational Training', ar: 'التدريب المهني' },
      leadership: { en: 'Leadership', ar: 'القيادة' },
      entrepreneurship: { en: 'Entrepreneurship', ar: 'ريادة الأعمال' },
      cultural: { en: 'Cultural Studies', ar: 'الدراسات الثقافية' }
    };
    return categoryMap[category]?.[currentLanguage] || category;
  };

  const renderHeroSection = () => (
    <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {currentLanguage === 'en' 
              ? 'Discover Excellence in Education'
              : 'اكتشف التميز في التعليم'
            }
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            {currentLanguage === 'en'
              ? 'Explore innovative school programs across Dubai, aligned with Education 33 and designed to prepare UAE nationals for future success.'
              : 'استكشف البرامج المدرسية المبتكرة في دبي، المتوافقة مع التعليم 33 والمصممة لإعداد المواطنين الإماراتيين للنجاح المستقبلي.'
            }
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={currentLanguage === 'en' ? 'Search programs, schools, or subjects...' : 'البحث في البرامج أو المدارس أو المواد...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 rtl:pl-4 rtl:pr-12 pr-4 py-4 text-gray-900 bg-white rounded-lg shadow-lg focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:outline-none text-lg"
              />
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold">{totalPrograms}+</div>
              <div className="text-teal-100">
                {currentLanguage === 'en' ? 'Programs Available' : 'برنامج متاح'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{schools.length}+</div>
              <div className="text-teal-100">
                {currentLanguage === 'en' ? 'Partner Schools' : 'مدرسة شريكة'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">94%</div>
              <div className="text-teal-100">
                {currentLanguage === 'en' ? 'Success Rate' : 'معدل النجاح'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeaturedPrograms = () => (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {currentLanguage === 'en' ? 'Featured Programs' : 'البرامج المميزة'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {currentLanguage === 'en'
              ? 'Discover our most popular and highly-rated educational programs'
              : 'اكتشف برامجنا التعليمية الأكثر شعبية وتقييماً'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredPrograms.map((program) => (
            <div key={program.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="relative">
                <img 
                  src={program.media.images[0] || '/images/placeholder-program.jpg'} 
                  alt={program.title[currentLanguage]}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4">
                  <button
                    onClick={() => toggleFavorite(program.id)}
                    className={`p-2 rounded-full ${favorites.includes(program.id) ? 'bg-red-500 text-white' : 'bg-white text-gray-600'} shadow-md hover:scale-110 transition-transform`}
                  >
                    <Heart className="w-4 h-4" fill={favorites.includes(program.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4">
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">
                    {getCategoryLabel(program.category)}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {program.title[currentLanguage]}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {program.description[currentLanguage]}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{program.school.name[currentLanguage]}</span>
                  </div>
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{program.successMetrics.satisfactionScore}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">{program.fees.amount.toLocaleString()} AED</span>
                  </div>
                  <button
                    onClick={() => openProgramModal(program)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                  >
                    {currentLanguage === 'en' ? 'Learn More' : 'اعرف المزيد'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFiltersSection = () => (
    <div className={`bg-gray-50 border-b transition-all duration-300 ${showFilters ? 'block' : 'hidden'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'en' ? 'Category' : 'الفئة'}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">{currentLanguage === 'en' ? 'All Categories' : 'جميع الفئات'}</option>
              {categories.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.label[currentLanguage]} ({cat.count})
                </option>
              ))}
            </select>
          </div>

          {/* School Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'en' ? 'School Type' : 'نوع المدرسة'}
            </label>
            <select
              value={selectedSchoolType}
              onChange={(e) => setSelectedSchoolType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">{currentLanguage === 'en' ? 'All Types' : 'جميع الأنواع'}</option>
              <option value="public">{currentLanguage === 'en' ? 'Public' : 'حكومية'}</option>
              <option value="private">{currentLanguage === 'en' ? 'Private' : 'خاصة'}</option>
            </select>
          </div>

          {/* Age Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'en' ? 'Age Range' : 'الفئة العمرية'}
            </label>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <input
                type="number"
                min="5"
                max="18"
                value={ageRange.min}
                onChange={(e) => setAgeRange(prev => ({ ...prev, min: parseInt(e.target.value) }))}
                className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                min="5"
                max="18"
                value={ageRange.max}
                onChange={(e) => setAgeRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'en' ? 'Sort By' : 'ترتيب حسب'}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="relevance">{currentLanguage === 'en' ? 'Relevance' : 'الصلة'}</option>
              <option value="name">{currentLanguage === 'en' ? 'Name' : 'الاسم'}</option>
              <option value="date">{currentLanguage === 'en' ? 'Date Added' : 'تاريخ الإضافة'}</option>
              <option value="rating">{currentLanguage === 'en' ? 'Rating' : 'التقييم'}</option>
              <option value="fees">{currentLanguage === 'en' ? 'Fees' : 'الرسوم'}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProgramCard = (program: SchoolProgram) => (
    <div key={program.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img 
          src={program.media.images[0] || '/images/placeholder-program.jpg'} 
          alt={program.title[currentLanguage]}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4">
          <button
            onClick={() => toggleFavorite(program.id)}
            className={`p-2 rounded-full ${favorites.includes(program.id) ? 'bg-red-500 text-white' : 'bg-white text-gray-600'} shadow-md hover:scale-110 transition-transform`}
          >
            <Heart className="w-4 h-4" fill={favorites.includes(program.id) ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4">
          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">
            {getCategoryLabel(program.category)}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 flex-1">
            {program.title[currentLanguage]}
          </h3>
          <div className="flex items-center space-x-1 rtl:space-x-reverse ml-2 rtl:ml-0 rtl:mr-2">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{program.successMetrics.satisfactionScore}</span>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-2">
          {program.description[currentLanguage]}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>{program.school.name[currentLanguage]}</span>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{program.duration.value} {program.duration.unit}</span>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>{program.targetAge.min}-{program.targetAge.max} years</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-bold text-lg text-gray-900">{program.fees.amount.toLocaleString()} AED</span>
            {program.fees.scholarshipAvailable && (
              <div className="text-green-600 text-xs">
                {currentLanguage === 'en' ? 'Scholarship Available' : 'منحة متاحة'}
              </div>
            )}
          </div>
          <button
            onClick={() => openProgramModal(program)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
          >
            {currentLanguage === 'en' ? 'View Details' : 'عرض التفاصيل'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderProgramsList = () => (
    <div className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentLanguage === 'en' ? 'All Programs' : 'جميع البرامج'}
            </h2>
            <p className="text-gray-600">
              {currentLanguage === 'en' 
                ? `Showing ${filteredPrograms.length} of ${totalPrograms} programs`
                : `عرض ${filteredPrograms.length} من ${totalPrograms} برنامج`
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-4 w-1/2"></div>
                  <div className="h-8 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {currentLanguage === 'en' ? 'No programs found' : 'لم يتم العثور على برامج'}
            </h3>
            <p className="text-gray-500">
              {currentLanguage === 'en' 
                ? 'Try adjusting your search criteria or filters'
                : 'حاول تعديل معايير البحث أو المرشحات'
              }
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' 
            : 'space-y-6'
          }>
            {filteredPrograms.map((program) => renderProgramCard(program))}
          </div>
        )}

        {/* Pagination */}
        {totalPrograms > programsPerPage && (
          <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse mt-12">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{currentLanguage === 'en' ? 'Previous' : 'السابق'}</span>
            </button>
            
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {[...Array(Math.ceil(totalPrograms / programsPerPage))].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === index + 1 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalPrograms / programsPerPage), prev + 1))}
              disabled={currentPage === Math.ceil(totalPrograms / programsPerPage)}
              className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{currentLanguage === 'en' ? 'Next' : 'التالي'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderProgramModal = () => {
    if (!selectedProgram) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="relative">
            <img 
              src={selectedProgram.media.images[0] || '/images/placeholder-program.jpg'} 
              alt={selectedProgram.title[currentLanguage]}
              className="w-full h-64 object-cover"
            />
            <button
              onClick={() => setShowProgramModal(false)}
              className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4">
              <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-teal-100 text-teal-800">
                {getCategoryLabel(selectedProgram.category)}
              </span>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedProgram.title[currentLanguage]}
                </h2>
                <div className="flex items-center space-x-4 rtl:space-x-reverse text-gray-600">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedProgram.school.name[currentLanguage]}</span>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>{selectedProgram.successMetrics.satisfactionScore}/5.0</span>
                  </div>
                </div>
              </div>
              <div className="text-right rtl:text-left">
                <div className="text-3xl font-bold text-teal-600">
                  {selectedProgram.fees.amount.toLocaleString()} AED
                </div>
                {selectedProgram.fees.scholarshipAvailable && (
                  <div className="text-green-600 text-sm">
                    {currentLanguage === 'en' ? 'Scholarship Available' : 'منحة متاحة'}
                  </div>
                )}
              </div>
            </div>

            <p className="text-gray-700 mb-8 text-lg leading-relaxed">
              {selectedProgram.description[currentLanguage]}
            </p>

            {/* Program Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {currentLanguage === 'en' ? 'Program Details' : 'تفاصيل البرنامج'}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span>{selectedProgram.duration.value} {selectedProgram.duration.unit}</span>
                  </div>
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span>{selectedProgram.targetAge.min}-{selectedProgram.targetAge.max} years</span>
                  </div>
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span>{selectedProgram.schedule.type} • {selectedProgram.schedule.hoursPerWeek} hours/week</span>
                  </div>
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <CheckCircle className="w-5 h-5 text-gray-400" />
                    <span>{selectedProgram.capacity.available} of {selectedProgram.capacity.total} spots available</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {currentLanguage === 'en' ? 'Success Metrics' : 'مقاييس النجاح'}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>{currentLanguage === 'en' ? 'Graduation Rate' : 'معدل التخرج'}</span>
                    <span className="font-semibold">{selectedProgram.successMetrics.graduationRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{currentLanguage === 'en' ? 'Employment Rate' : 'معدل التوظيف'}</span>
                    <span className="font-semibold">{selectedProgram.successMetrics.employmentRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{currentLanguage === 'en' ? 'Industry Partnerships' : 'الشراكات الصناعية'}</span>
                    <span className="font-semibold">{selectedProgram.successMetrics.industryPartnerships}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Outcomes */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {currentLanguage === 'en' ? 'Learning Outcomes' : 'نتائج التعلم'}
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedProgram.curriculum.learningOutcomes[currentLanguage].map((outcome, index) => (
                  <li key={index} className="flex items-start space-x-3 rtl:space-x-reverse">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {currentLanguage === 'en' ? 'Contact Information' : 'معلومات الاتصال'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span>{selectedProgram.applicationProcess.contactInfo.phone}</span>
                </div>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span>{selectedProgram.applicationProcess.contactInfo.email}</span>
                </div>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{selectedProgram.applicationProcess.contactInfo.address[currentLanguage]}</span>
                </div>
                {selectedProgram.applicationProcess.contactInfo.website && (
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <a 
                      href={selectedProgram.applicationProcess.contactInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-700"
                    >
                      {currentLanguage === 'en' ? 'Visit Website' : 'زيارة الموقع'}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <button className="flex-1 bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors font-medium">
                {currentLanguage === 'en' ? 'Apply Now' : 'تقدم الآن'}
              </button>
              <button 
                onClick={() => toggleFavorite(selectedProgram.id)}
                className={`p-3 rounded-lg border ${favorites.includes(selectedProgram.id) ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-600'} hover:scale-105 transition-transform`}
              >
                <Heart className="w-5 h-5" fill={favorites.includes(selectedProgram.id) ? 'currentColor' : 'none'} />
              </button>
              <button className="p-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              {selectedProgram.media.brochure && (
                <button className="p-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <HybridGovernmentNavFixed 
      onLanguageToggle={() => setCurrentLanguage(currentLanguage === 'en' ? 'ar' : 'en')}
      currentLanguage={currentLanguage}
    >
      <div className={`min-h-screen ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
        {renderHeroSection()}
        {renderFiltersSection()}
        {renderFeaturedPrograms()}
        {renderProgramsList()}
        {showProgramModal && renderProgramModal()}
      </div>
    </HybridGovernmentNavFixed>
  );
};

export default SchoolProgramsPage;
