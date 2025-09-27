// School Programs Page - Fixed version
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
import { schoolProgramsAPIService } from '../services/schoolProgramsServiceAPI';

// Simplified mock data for testing
const mockPrograms = [
  {
    id: 'prog-001',
    title: {
      en: 'Advanced STEM Innovation Program',
      ar: 'برنامج الابتكار المتقدم في العلوم والتكنولوجيا'
    },
    description: {
      en: 'A comprehensive STEM program focusing on robotics, AI, and sustainable technology solutions.',
      ar: 'برنامج شامل في العلوم والتكنولوجيا يركز على الروبوتات والذكاء الاصطناعي.'
    },
    school: {
      name: {
        en: 'Dubai International Academy',
        ar: 'أكاديمية دبي الدولية'
      },
      location: 'Al Barsha, Dubai'
    },
    category: 'STEM',
    ageRange: { min: 14, max: 18 },
    duration: '2 years',
    fees: { currency: 'AED', amount: 25000 },
    rating: 4.8,
    enrolledStudents: 120,
    maxCapacity: 150,
    featured: true
  },
  {
    id: 'prog-002',
    title: {
      en: 'Creative Arts Excellence Program',
      ar: 'برنامج التميز في الفنون الإبداعية'
    },
    description: {
      en: 'Develop artistic talents through comprehensive visual and performing arts education.',
      ar: 'تطوير المواهب الفنية من خلال التعليم الشامل للفنون البصرية والأدائية.'
    },
    school: {
      name: {
        en: 'GEMS Wellington Academy',
        ar: 'أكاديمية جيمس ويلينغتون'
      },
      location: 'Silicon Oasis, Dubai'
    },
    category: 'Arts',
    ageRange: { min: 12, max: 17 },
    duration: '3 years',
    fees: { currency: 'AED', amount: 22000 },
    rating: 4.6,
    enrolledStudents: 85,
    maxCapacity: 100,
    featured: true
  },
  {
    id: 'prog-003',
    title: {
      en: 'Sports Leadership Academy',
      ar: 'أكاديمية القيادة الرياضية'
    },
    description: {
      en: 'Combine athletic excellence with leadership development and academic achievement.',
      ar: 'دمج التميز الرياضي مع تطوير القيادة والإنجاز الأكاديمي.'
    },
    school: {
      name: {
        en: 'American School of Dubai',
        ar: 'المدرسة الأمريكية في دبي'
      },
      location: 'Jumeirah, Dubai'
    },
    category: 'Sports',
    ageRange: { min: 13, max: 18 },
    duration: '4 years',
    fees: { currency: 'AED', amount: 28000 },
    rating: 4.7,
    enrolledStudents: 95,
    maxCapacity: 120,
    featured: false
  }
];

const SchoolProgramsPage: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>('en');
  const [programs, setPrograms] = useState<any[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [showProgramModal, setShowProgramModal] = useState(false);

  const categories = [
    { id: 'all', name: { en: 'All Programs', ar: 'جميع البرامج' } },
    { id: 'STEM', name: { en: 'STEM', ar: 'العلوم والتكنولوجيا' } },
    { id: 'Arts', name: { en: 'Arts', ar: 'الفنون' } },
    { id: 'Sports', name: { en: 'Sports', ar: 'الرياضة' } },
    { id: 'Languages', name: { en: 'Languages', ar: 'اللغات' } }
  ];

  // Load programs from API
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setLoading(true);
        const response = await schoolProgramsAPIService.getPrograms({ status: 'published' });
        
        // Transform API data to match component interface
        const transformedPrograms = response.programs.map(program => ({
          id: program.id,
          title: program.title,
          description: program.description,
          school: {
            name: program.school.name,
            location: program.school.location
          },
          category: program.category,
          ageRange: program.targetAge,
          duration: `${program.duration.value} ${program.duration.unit}`,
          fees: program.fees,
          rating: program.successMetrics?.satisfactionScore || 4.5,
          enrolledStudents: program.capacity.total - program.capacity.available,
          maxCapacity: program.capacity.total,
          featured: program.featured || false
        }));
        
        setPrograms(transformedPrograms);
        setFilteredPrograms(transformedPrograms);
      } catch (error) {
        console.error('Error loading programs:', error);
        // Fallback to mock data
        setPrograms(mockPrograms);
        setFilteredPrograms(mockPrograms);
      } finally {
        setLoading(false);
      }
    };

    loadPrograms();
  }, []);

  useEffect(() => {
    filterPrograms();
  }, [searchQuery, selectedCategory, programs]);

  const filterPrograms = () => {
    let filtered = programs;

    if (searchQuery) {
      filtered = filtered.filter(program => 
        program.title.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.title.ar.includes(searchQuery) ||
        program.school.name.en.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(program => program.category === selectedCategory);
    }

    setFilteredPrograms(filtered);
  };

  const handleLanguageToggle = () => {
    setCurrentLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const openProgramModal = (program: any) => {
    setSelectedProgram(program);
    setShowProgramModal(true);
  };

  const closeProgramModal = () => {
    setSelectedProgram(null);
    setShowProgramModal(false);
  };

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
            <p className="text-gray-600">Loading programs...</p>
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

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {currentLanguage === 'en' 
                ? 'Discover Dubai School Programs' 
                : 'اكتشف البرامج المدرسية في دبي'
              }
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              {currentLanguage === 'en'
                ? 'Explore innovative educational programs across Dubai schools, aligned with KHDA standards and Education 33 goals.'
                : 'استكشف البرامج التعليمية المبتكرة في مدارس دبي، المتوافقة مع معايير هيئة المعرفة وأهداف التعليم 33.'
              }
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={currentLanguage === 'en' ? 'Search programs...' : 'البحث في البرامج...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name[currentLanguage]}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-teal-600 text-white' : 'text-gray-600'}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'text-gray-600'}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentLanguage === 'en' ? 'Available Programs' : 'البرامج المتاحة'}
            </h2>
            <p className="text-gray-600">
              {currentLanguage === 'en' 
                ? `Showing ${filteredPrograms.length} programs`
                : `عرض ${filteredPrograms.length} برنامج`
              }
            </p>
          </div>

          {filteredPrograms.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {currentLanguage === 'en' ? 'No programs found' : 'لم يتم العثور على برامج'}
              </h3>
              <p className="text-gray-600">
                {currentLanguage === 'en' 
                  ? 'Try adjusting your search criteria'
                  : 'حاول تعديل معايير البحث'
                }
              </p>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {filteredPrograms.map((program) => (
                <div
                  key={program.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
                  onClick={() => openProgramModal(program)}
                >
                  <div className="p-6">
                    {/* Program Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {program.title[currentLanguage]}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {program.school.name[currentLanguage]}
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {program.school.location}
                        </div>
                      </div>
                      {program.featured && (
                        <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                          {currentLanguage === 'en' ? 'Featured' : 'مميز'}
                        </div>
                      )}
                    </div>

                    {/* Program Description */}
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {program.description[currentLanguage]}
                    </p>

                    {/* Program Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>
                          {currentLanguage === 'en' 
                            ? `Ages ${program.ageRange.min}-${program.ageRange.max}`
                            : `الأعمار ${program.ageRange.min}-${program.ageRange.max}`
                          }
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{program.duration}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="h-4 w-4 mr-2 text-yellow-500" />
                        <span>{program.rating}/5.0</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Award className="h-4 w-4 mr-2" />
                        <span>{program.category}</span>
                      </div>
                    </div>

                    {/* Enrollment Info */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-teal-600">
                          {program.fees.currency} {program.fees.amount.toLocaleString()}
                        </span>
                        <span className="ml-1">
                          {currentLanguage === 'en' ? 'per year' : 'سنوياً'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {program.enrolledStudents}/{program.maxCapacity} 
                        {currentLanguage === 'en' ? ' enrolled' : ' مسجل'}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-3 bg-gray-50 border-t">
                    <button className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center">
                      {currentLanguage === 'en' ? 'Learn More' : 'اعرف المزيد'}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Program Modal */}
      {showProgramModal && selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedProgram.title[currentLanguage]}
              </h2>
              <button
                onClick={closeProgramModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    {currentLanguage === 'en' ? 'Program Overview' : 'نظرة عامة على البرنامج'}
                  </h3>
                  <p className="text-gray-700 mb-4">
                    {selectedProgram.description[currentLanguage]}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium">{selectedProgram.school.name[currentLanguage]}</p>
                        <p className="text-sm text-gray-600">{selectedProgram.school.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-gray-400 mr-3" />
                      <span>
                        {currentLanguage === 'en' 
                          ? `Ages ${selectedProgram.ageRange.min}-${selectedProgram.ageRange.max}`
                          : `الأعمار ${selectedProgram.ageRange.min}-${selectedProgram.ageRange.max}`
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-3" />
                      <span>{selectedProgram.duration}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-500 mr-3" />
                      <span>{selectedProgram.rating}/5.0 Rating</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    {currentLanguage === 'en' ? 'Enrollment Details' : 'تفاصيل التسجيل'}
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="text-2xl font-bold text-teal-600 mb-1">
                      {selectedProgram.fees.currency} {selectedProgram.fees.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {currentLanguage === 'en' ? 'per year' : 'سنوياً'}
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {currentLanguage === 'en' ? 'Enrolled Students' : 'الطلاب المسجلون'}
                      </span>
                      <span className="font-medium">
                        {selectedProgram.enrolledStudents}/{selectedProgram.maxCapacity}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {currentLanguage === 'en' ? 'Category' : 'الفئة'}
                      </span>
                      <span className="font-medium">{selectedProgram.category}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors">
                      {currentLanguage === 'en' ? 'Apply Now' : 'تقدم الآن'}
                    </button>
                    
                    <button className="w-full border border-teal-600 text-teal-600 py-3 px-4 rounded-lg hover:bg-teal-50 transition-colors">
                      {currentLanguage === 'en' ? 'Download Brochure' : 'تحميل الكتيب'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolProgramsPage;
