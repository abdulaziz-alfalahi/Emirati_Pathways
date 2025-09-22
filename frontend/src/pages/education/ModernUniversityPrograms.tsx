import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Award, 
  Calendar,
  MapPin,
  Clock,
  Star,
  Filter,
  Search,
  ArrowRight,
  CheckCircle,
  Building,
  Globe,
  TrendingUp,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { UnifiedPageLayout } from '../../components/design-system/UnifiedPageLayout';
import { StandardCard, FeatureCard, StatsCard } from '../../components/design-system/StandardCard';
import '../../styles/design-system.css';

const ModernUniversityPrograms: React.FC = () => {
  const { t } = useTranslation();
  const [selectedField, setSelectedField] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const breadcrumbs = [
    { label: t('navigation.education_pathway') },
    { label: t('pages.university_programs.title') }
  ];

  const fieldFilters = [
    { id: 'all', label: t('pages.university_programs.filters.all_fields') },
    { id: 'engineering', label: t('pages.university_programs.filters.engineering') },
    { id: 'business', label: t('pages.university_programs.filters.business') },
    { id: 'medicine', label: t('pages.university_programs.filters.medicine') },
    { id: 'technology', label: t('pages.university_programs.filters.technology') }
  ];

  const levelFilters = [
    { id: 'all', label: t('pages.university_programs.filters.all_levels') },
    { id: 'bachelor', label: t('pages.university_programs.filters.bachelor') },
    { id: 'master', label: t('pages.university_programs.filters.master') },
    { id: 'phd', label: t('pages.university_programs.filters.phd') }
  ];

  const universities = [
    {
      id: 'uae-university',
      name: t('pages.university_programs.universities.uae_university.name'),
      description: t('pages.university_programs.universities.uae_university.description'),
      location: 'Al Ain, UAE',
      ranking: '#1 in UAE',
      students: '14,000+',
      programs: '200+',
      acceptanceRate: '75%',
      tuitionRange: 'AED 25,000 - 45,000',
      image: '/api/placeholder/400/200',
      badge: t('common.top_ranked'),
      programs_offered: [
        {
          name: 'Computer Engineering',
          level: 'bachelor',
          field: 'engineering',
          duration: '4 years',
          language: 'English/Arabic'
        },
        {
          name: 'Business Administration',
          level: 'master',
          field: 'business',
          duration: '2 years',
          language: 'English'
        },
        {
          name: 'Medicine',
          level: 'bachelor',
          field: 'medicine',
          duration: '6 years',
          language: 'English'
        }
      ]
    },
    {
      id: 'aus',
      name: t('pages.university_programs.universities.aus.name'),
      description: t('pages.university_programs.universities.aus.description'),
      location: 'Sharjah, UAE',
      ranking: '#2 in UAE',
      students: '6,000+',
      programs: '100+',
      acceptanceRate: '65%',
      tuitionRange: 'AED 65,000 - 85,000',
      image: '/api/placeholder/400/200',
      badge: t('common.international'),
      programs_offered: [
        {
          name: 'Artificial Intelligence',
          level: 'master',
          field: 'technology',
          duration: '2 years',
          language: 'English'
        },
        {
          name: 'International Business',
          level: 'bachelor',
          field: 'business',
          duration: '4 years',
          language: 'English'
        }
      ]
    },
    {
      id: 'hct',
      name: t('pages.university_programs.universities.hct.name'),
      description: t('pages.university_programs.universities.hct.description'),
      location: 'Multiple Campuses, UAE',
      ranking: '#3 in UAE',
      students: '23,000+',
      programs: '150+',
      acceptanceRate: '80%',
      tuitionRange: 'AED 15,000 - 35,000',
      image: '/api/placeholder/400/200',
      badge: t('common.affordable'),
      programs_offered: [
        {
          name: 'Applied Technology',
          level: 'bachelor',
          field: 'technology',
          duration: '4 years',
          language: 'English/Arabic'
        },
        {
          name: 'Health Sciences',
          level: 'bachelor',
          field: 'medicine',
          duration: '4 years',
          language: 'English'
        }
      ]
    },
    {
      id: 'nyuad',
      name: t('pages.university_programs.universities.nyuad.name'),
      description: t('pages.university_programs.universities.nyuad.description'),
      location: 'Abu Dhabi, UAE',
      ranking: 'Global Top 50',
      students: '1,500+',
      programs: '25+',
      acceptanceRate: '15%',
      tuitionRange: 'Full Scholarships Available',
      image: '/api/placeholder/400/200',
      badge: t('common.prestigious'),
      programs_offered: [
        {
          name: 'Liberal Arts',
          level: 'bachelor',
          field: 'business',
          duration: '4 years',
          language: 'English'
        },
        {
          name: 'Engineering',
          level: 'bachelor',
          field: 'engineering',
          duration: '4 years',
          language: 'English'
        }
      ]
    }
  ];

  const filteredUniversities = universities.filter(university => {
    const matchesSearch = university.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         university.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesField = selectedField === 'all' || 
                        university.programs_offered.some(program => program.field === selectedField);
    
    const matchesLevel = selectedLevel === 'all' || 
                        university.programs_offered.some(program => program.level === selectedLevel);
    
    return matchesSearch && matchesField && matchesLevel;
  });

  const stats = [
    {
      title: t('pages.university_programs.stats.universities'),
      value: '50+',
      change: 'Partner institutions',
      changeType: 'neutral' as const,
      icon: Building
    },
    {
      title: t('pages.university_programs.stats.programs'),
      value: '500+',
      change: 'Available programs',
      changeType: 'neutral' as const,
      icon: BookOpen
    },
    {
      title: t('pages.university_programs.stats.graduates'),
      value: '25,000+',
      change: '+12% this year',
      changeType: 'positive' as const,
      icon: GraduationCap
    },
    {
      title: t('pages.university_programs.stats.employment_rate'),
      value: '94%',
      change: 'Graduate employment',
      changeType: 'positive' as const,
      icon: Briefcase
    }
  ];

  const popularFields = [
    {
      name: t('pages.university_programs.popular_fields.engineering'),
      programs: 85,
      growth: '+15%',
      avgSalary: 'AED 120K',
      icon: Award,
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: t('pages.university_programs.popular_fields.business'),
      programs: 120,
      growth: '+12%',
      avgSalary: 'AED 95K',
      icon: Briefcase,
      color: 'from-green-500 to-green-600'
    },
    {
      name: t('pages.university_programs.popular_fields.technology'),
      programs: 65,
      growth: '+25%',
      avgSalary: 'AED 110K',
      icon: Globe,
      color: 'from-purple-500 to-purple-600'
    },
    {
      name: t('pages.university_programs.popular_fields.medicine'),
      programs: 45,
      growth: '+8%',
      avgSalary: 'AED 150K',
      icon: Users,
      color: 'from-red-500 to-red-600'
    }
  ];

  return (
    <UnifiedPageLayout
      title={t('pages.university_programs.title')}
      subtitle={t('pages.university_programs.subtitle')}
      breadcrumbs={breadcrumbs}
      headerActions={
        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            {t('common.filter')}
          </button>
          <button className="btn-primary">
            {t('pages.university_programs.apply_now')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      }
    >
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8 mb-12">
        <div className="max-w-4xl">
          <h2 className="text-display-2 text-gray-900 mb-4">
            {t('pages.university_programs.hero.title')}
          </h2>
          <p className="text-body-large text-gray-600 mb-6">
            {t('pages.university_programs.hero.description')}
          </p>
          
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('pages.university_programs.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {fieldFilters.map((filter) => (
                  <option key={filter.id} value={filter.id}>
                    {filter.label}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {levelFilters.map((filter) => (
                  <option key={filter.id} value={filter.id}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Popular Fields */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-display-2 text-gray-900 mb-4">
            {t('pages.university_programs.popular_fields.title')}
          </h2>
          <p className="text-body-large text-gray-600">
            {t('pages.university_programs.popular_fields.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularFields.map((field, index) => {
            const Icon = field.icon;
            
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${field.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {field.name}
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('common.programs')}:</span>
                    <span className="font-medium text-gray-900">{field.programs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('common.growth')}:</span>
                    <span className="font-medium text-green-600">{field.growth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('common.avg_salary')}:</span>
                    <span className="font-medium text-blue-600">{field.avgSalary}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Universities Grid */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-display-2 text-gray-900 mb-4">
            {t('pages.university_programs.universities.title')}
          </h2>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto">
            {t('pages.university_programs.universities.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredUniversities.map((university) => (
            <div
              key={university.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* University Image */}
              <div className="relative h-48">
                <img
                  src={university.image}
                  alt={university.name}
                  className="w-full h-full object-cover"
                />
                {university.badge && (
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      university.badge === t('common.top_ranked')
                        ? 'bg-yellow-100 text-yellow-800'
                        : university.badge === t('common.international')
                        ? 'bg-blue-100 text-blue-800'
                        : university.badge === t('common.affordable')
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {university.badge}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                {/* University Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {university.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {university.description}
                  </p>
                </div>

                {/* University Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{university.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{university.ranking}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{university.students} students</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{university.programs} programs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{university.acceptanceRate} acceptance</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{university.tuitionRange}</span>
                    </div>
                  </div>
                </div>

                {/* Featured Programs */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    {t('pages.university_programs.featured_programs')}
                  </h4>
                  <div className="space-y-2">
                    {university.programs_offered.slice(0, 2).map((program, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{program.name}</span>
                          <div className="text-xs text-gray-500">
                            {program.level} • {program.duration} • {program.language}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button className="flex-1 btn-primary text-sm py-2">
                    {t('pages.university_programs.view_programs')}
                  </button>
                  <button className="flex-1 btn-secondary text-sm py-2">
                    {t('pages.university_programs.visit_campus')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Application Timeline */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-display-2 text-gray-900 mb-4">
            {t('pages.university_programs.application_timeline.title')}
          </h2>
          <p className="text-body-large text-gray-600">
            {t('pages.university_programs.application_timeline.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              month: t('pages.university_programs.application_timeline.september.month'),
              title: t('pages.university_programs.application_timeline.september.title'),
              description: t('pages.university_programs.application_timeline.september.description'),
              icon: Search
            },
            {
              month: t('pages.university_programs.application_timeline.december.month'),
              title: t('pages.university_programs.application_timeline.december.title'),
              description: t('pages.university_programs.application_timeline.december.description'),
              icon: BookOpen
            },
            {
              month: t('pages.university_programs.application_timeline.march.month'),
              title: t('pages.university_programs.application_timeline.march.title'),
              description: t('pages.university_programs.application_timeline.march.description'),
              icon: CheckCircle
            },
            {
              month: t('pages.university_programs.application_timeline.august.month'),
              title: t('pages.university_programs.application_timeline.august.title'),
              description: t('pages.university_programs.application_timeline.august.description'),
              icon: GraduationCap
            }
          ].map((timeline, index) => {
            const Icon = timeline.icon;
            
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-8 w-8 text-teal-600" />
                </div>
                <div className="text-sm font-bold text-teal-600 mb-2">
                  {timeline.month}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {timeline.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {timeline.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">
          {t('pages.university_programs.cta.title')}
        </h2>
        <p className="text-lg mb-6 opacity-90">
          {t('pages.university_programs.cta.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-teal-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            {t('pages.university_programs.cta.explore_programs')}
          </button>
          <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-teal-600 transition-colors">
            {t('pages.university_programs.cta.schedule_consultation')}
          </button>
        </div>
      </div>
    </UnifiedPageLayout>
  );
};

export default ModernUniversityPrograms;
