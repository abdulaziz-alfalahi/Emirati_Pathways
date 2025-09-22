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
  Target,
  TrendingUp
} from 'lucide-react';
import { UnifiedPageLayout } from '../../components/design-system/UnifiedPageLayout';
import { StandardCard, FeatureCard, StatsCard } from '../../components/design-system/StandardCard';
import '../../styles/design-system.css';

const ModernSchoolPrograms: React.FC = () => {
  const { t } = useTranslation();
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const breadcrumbs = [
    { label: t('navigation.education_pathway') },
    { label: t('pages.school_programs.title') }
  ];

  const gradeFilters = [
    { id: 'all', label: t('pages.school_programs.filters.all_grades') },
    { id: 'elementary', label: t('pages.school_programs.filters.elementary') },
    { id: 'middle', label: t('pages.school_programs.filters.middle_school') },
    { id: 'high', label: t('pages.school_programs.filters.high_school') }
  ];

  const programs = [
    {
      id: 'stem-excellence',
      title: t('pages.school_programs.programs.stem_excellence.title'),
      description: t('pages.school_programs.programs.stem_excellence.description'),
      grade: 'high',
      duration: '4 years',
      students: '2,500+',
      successRate: '95%',
      features: [
        t('pages.school_programs.programs.stem_excellence.features.0'),
        t('pages.school_programs.programs.stem_excellence.features.1'),
        t('pages.school_programs.programs.stem_excellence.features.2'),
        t('pages.school_programs.programs.stem_excellence.features.3')
      ],
      schools: ['Dubai International Academy', 'GEMS Wellington', 'American School of Dubai'],
      icon: Target,
      color: 'from-blue-500 to-blue-600',
      badge: t('common.popular')
    },
    {
      id: 'arabic-heritage',
      title: t('pages.school_programs.programs.arabic_heritage.title'),
      description: t('pages.school_programs.programs.arabic_heritage.description'),
      grade: 'all',
      duration: 'All levels',
      students: '5,000+',
      successRate: '92%',
      features: [
        t('pages.school_programs.programs.arabic_heritage.features.0'),
        t('pages.school_programs.programs.arabic_heritage.features.1'),
        t('pages.school_programs.programs.arabic_heritage.features.2'),
        t('pages.school_programs.programs.arabic_heritage.features.3')
      ],
      schools: ['Al Mawakeb School', 'Dubai National School', 'Jumeirah Primary School'],
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      badge: t('common.featured')
    },
    {
      id: 'leadership-development',
      title: t('pages.school_programs.programs.leadership_development.title'),
      description: t('pages.school_programs.programs.leadership_development.description'),
      grade: 'middle',
      duration: '3 years',
      students: '1,800+',
      successRate: '88%',
      features: [
        t('pages.school_programs.programs.leadership_development.features.0'),
        t('pages.school_programs.programs.leadership_development.features.1'),
        t('pages.school_programs.programs.leadership_development.features.2'),
        t('pages.school_programs.programs.leadership_development.features.3')
      ],
      schools: ['GEMS Modern Academy', 'Dubai British School', 'Repton School Dubai'],
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      badge: null
    },
    {
      id: 'innovation-lab',
      title: t('pages.school_programs.programs.innovation_lab.title'),
      description: t('pages.school_programs.programs.innovation_lab.description'),
      grade: 'elementary',
      duration: '6 years',
      students: '3,200+',
      successRate: '90%',
      features: [
        t('pages.school_programs.programs.innovation_lab.features.0'),
        t('pages.school_programs.programs.innovation_lab.features.1'),
        t('pages.school_programs.programs.innovation_lab.features.2'),
        t('pages.school_programs.programs.innovation_lab.features.3')
      ],
      schools: ['GEMS FirstPoint School', 'Dubai International School', 'Kings School Dubai'],
      icon: Award,
      color: 'from-orange-500 to-orange-600',
      badge: t('common.new')
    }
  ];

  const filteredPrograms = programs.filter(program => {
    const matchesGrade = selectedGrade === 'all' || program.grade === selectedGrade || program.grade === 'all';
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGrade && matchesSearch;
  });

  const stats = [
    {
      title: t('pages.school_programs.stats.total_programs'),
      value: '50+',
      change: 'Active programs',
      changeType: 'neutral' as const,
      icon: GraduationCap
    },
    {
      title: t('pages.school_programs.stats.participating_schools'),
      value: '200+',
      change: '+12 this year',
      changeType: 'positive' as const,
      icon: BookOpen
    },
    {
      title: t('pages.school_programs.stats.enrolled_students'),
      value: '15,000+',
      change: '+8% growth',
      changeType: 'positive' as const,
      icon: Users
    },
    {
      title: t('pages.school_programs.stats.success_rate'),
      value: '91%',
      change: 'Program completion',
      changeType: 'positive' as const,
      icon: Award
    }
  ];

  const achievements = [
    {
      title: t('pages.school_programs.achievements.international_recognition'),
      description: t('pages.school_programs.achievements.international_recognition_desc'),
      icon: Award,
      metric: '25+ Awards'
    },
    {
      title: t('pages.school_programs.achievements.university_acceptance'),
      description: t('pages.school_programs.achievements.university_acceptance_desc'),
      icon: TrendingUp,
      metric: '98% Rate'
    },
    {
      title: t('pages.school_programs.achievements.student_satisfaction'),
      description: t('pages.school_programs.achievements.student_satisfaction_desc'),
      icon: Star,
      metric: '4.8/5 Rating'
    }
  ];

  return (
    <UnifiedPageLayout
      title={t('pages.school_programs.title')}
      subtitle={t('pages.school_programs.subtitle')}
      breadcrumbs={breadcrumbs}
      headerActions={
        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            {t('common.filter')}
          </button>
          <button className="btn-primary">
            {t('pages.school_programs.apply_now')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      }
    >
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8 mb-12">
        <div className="max-w-3xl">
          <h2 className="text-display-2 text-gray-900 mb-4">
            {t('pages.school_programs.hero.title')}
          </h2>
          <p className="text-body-large text-gray-600 mb-6">
            {t('pages.school_programs.hero.description')}
          </p>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('pages.school_programs.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2">
              {gradeFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedGrade(filter.id)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    selectedGrade === filter.id
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
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

      {/* Programs Grid */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-display-2 text-gray-900 mb-4">
            {t('pages.school_programs.programs.title')}
          </h2>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto">
            {t('pages.school_programs.programs.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredPrograms.map((program) => {
            const Icon = program.icon;
            
            return (
              <div
                key={program.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300"
              >
                {/* Program Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${program.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  {program.badge && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      program.badge === t('common.popular') 
                        ? 'bg-yellow-100 text-yellow-800'
                        : program.badge === t('common.featured')
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {program.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {program.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {program.description}
                </p>

                {/* Program Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{program.duration}</div>
                    <div className="text-xs text-gray-500">{t('common.duration')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{program.students}</div>
                    <div className="text-xs text-gray-500">{t('common.students')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{program.successRate}</div>
                    <div className="text-xs text-gray-500">{t('common.success_rate')}</div>
                  </div>
                </div>

                {/* Program Features */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    {t('pages.school_programs.program_features')}
                  </h4>
                  <div className="space-y-2">
                    {program.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-teal-600 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Participating Schools */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    {t('pages.school_programs.participating_schools')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {program.schools.slice(0, 2).map((school, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                      >
                        {school}
                      </span>
                    ))}
                    {program.schools.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                        +{program.schools.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button className="flex-1 btn-primary text-sm py-2">
                    {t('pages.school_programs.learn_more')}
                  </button>
                  <button className="flex-1 btn-secondary text-sm py-2">
                    {t('pages.school_programs.apply_now')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements Section */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-display-2 text-gray-900 mb-4">
            {t('pages.school_programs.achievements.title')}
          </h2>
          <p className="text-body-large text-gray-600">
            {t('pages.school_programs.achievements.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {achievements.map((achievement, index) => {
            const Icon = achievement.icon;
            
            return (
              <StandardCard
                key={index}
                title={achievement.title}
                description={achievement.description}
                icon={Icon}
                className="text-center"
              >
                <div className="mt-4 p-3 bg-teal-50 rounded-lg">
                  <div className="text-2xl font-bold text-teal-600">
                    {achievement.metric}
                  </div>
                </div>
              </StandardCard>
            );
          })}
        </div>
      </div>

      {/* Application Process */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-display-2 text-gray-900 mb-4">
            {t('pages.school_programs.application_process.title')}
          </h2>
          <p className="text-body-large text-gray-600">
            {t('pages.school_programs.application_process.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: 1,
              title: t('pages.school_programs.application_process.step_1.title'),
              description: t('pages.school_programs.application_process.step_1.description'),
              icon: Search
            },
            {
              step: 2,
              title: t('pages.school_programs.application_process.step_2.title'),
              description: t('pages.school_programs.application_process.step_2.description'),
              icon: BookOpen
            },
            {
              step: 3,
              title: t('pages.school_programs.application_process.step_3.title'),
              description: t('pages.school_programs.application_process.step_3.description'),
              icon: Users
            },
            {
              step: 4,
              title: t('pages.school_programs.application_process.step_4.title'),
              description: t('pages.school_programs.application_process.step_4.description'),
              icon: CheckCircle
            }
          ].map((step, index) => {
            const Icon = step.icon;
            
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-8 w-8 text-teal-600" />
                </div>
                <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">
          {t('pages.school_programs.cta.title')}
        </h2>
        <p className="text-lg mb-6 opacity-90">
          {t('pages.school_programs.cta.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-teal-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            {t('pages.school_programs.cta.browse_programs')}
          </button>
          <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-teal-600 transition-colors">
            {t('pages.school_programs.cta.contact_advisor')}
          </button>
        </div>
      </div>
    </UnifiedPageLayout>
  );
};

export default ModernSchoolPrograms;
