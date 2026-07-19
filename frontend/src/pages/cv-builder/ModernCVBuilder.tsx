import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Download, 
  Eye, 
  Edit3, 
  Save,
  Upload,
  CheckCircle,
  AlertCircle,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  Plus,
  Trash2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { UnifiedPageLayout } from '../../components/design-system/UnifiedPageLayout';
import { StandardCard, StatsCard } from '../../components/design-system/StandardCard';
import '../../styles/design-system.css';

const ModernCVBuilder: React.FC = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('personal');
  const [completionPercentage, setCompletionPercentage] = useState(65);

  const breadcrumbs = [
    { label: t('navigation.career_entry') },
    { label: t('pages.cv_builder.title') }
  ];

  const cvSections = [
    {
      id: 'personal',
      title: t('pages.cv_builder.sections.personal_info'),
      icon: User,
      completed: true,
      progress: 100
    },
    {
      id: 'experience',
      title: t('pages.cv_builder.sections.work_experience'),
      icon: Briefcase,
      completed: true,
      progress: 100
    },
    {
      id: 'education',
      title: t('pages.cv_builder.sections.education'),
      icon: GraduationCap,
      completed: false,
      progress: 60
    },
    {
      id: 'skills',
      title: t('pages.cv_builder.sections.skills'),
      icon: Award,
      completed: false,
      progress: 40
    },
    {
      id: 'languages',
      title: t('pages.cv_builder.sections.languages'),
      icon: Languages,
      completed: false,
      progress: 20
    }
  ];

  const templates = [
    {
      id: 'professional',
      name: t('pages.cv_builder.templates.professional'),
      description: t('pages.cv_builder.templates.professional_desc'),
      preview: '/api/placeholder/200/280',
      popular: true
    },
    {
      id: 'modern',
      name: t('pages.cv_builder.templates.modern'),
      description: t('pages.cv_builder.templates.modern_desc'),
      preview: '/api/placeholder/200/280',
      popular: false
    },
    {
      id: 'creative',
      name: t('pages.cv_builder.templates.creative'),
      description: t('pages.cv_builder.templates.creative_desc'),
      preview: '/api/placeholder/200/280',
      popular: false
    },
    {
      id: 'executive',
      name: t('pages.cv_builder.templates.executive'),
      description: t('pages.cv_builder.templates.executive_desc'),
      preview: '/api/placeholder/200/280',
      popular: true
    }
  ];

  const stats = [
    {
      title: t('pages.cv_builder.stats.cvs_created'),
      value: '25,000+',
      change: '+15% this month',
      changeType: 'positive' as const,
      icon: FileText
    },
    {
      title: t('pages.cv_builder.stats.success_rate'),
      value: '89%',
      change: 'Interview success',
      changeType: 'positive' as const,
      icon: CheckCircle
    },
    {
      title: t('pages.cv_builder.stats.avg_time'),
      value: '15 min',
      change: 'Average build time',
      changeType: 'neutral' as const,
      icon: Edit3
    },
    {
      title: t('pages.cv_builder.stats.templates'),
      value: '12+',
      change: 'Professional templates',
      changeType: 'neutral' as const,
      icon: Award
    }
  ];

  const aiSuggestions = [
    {
      type: 'skill',
      title: t('pages.cv_builder.ai_suggestions.add_skill'),
      description: 'Python, Machine Learning',
      action: t('common.add')
    },
    {
      type: 'experience',
      title: t('pages.cv_builder.ai_suggestions.improve_description'),
      description: t('pages.cv_builder.ai_suggestions.improve_description_detail'),
      action: t('common.improve')
    },
    {
      type: 'education',
      title: t('pages.cv_builder.ai_suggestions.add_certification'),
      description: 'AWS Cloud Practitioner',
      action: t('common.add')
    }
  ];

  return (
    <UnifiedPageLayout
      title={t('pages.cv_builder.title')}
      subtitle={t('pages.cv_builder.subtitle')}
      breadcrumbs={breadcrumbs}
      headerActions={
        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <Eye className="h-4 w-4 me-2" />
            {t('pages.cv_builder.preview')}
          </button>
          <button className="btn-primary">
            <Download className="h-4 w-4 me-2" />
            {t('pages.cv_builder.download')}
          </button>
        </div>
      }
    >
      {/* Hero Section with Progress */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8 mb-12">
        <div className="flex flex-col lg:flex-row items-start justify-between">
          <div className="flex-1 mb-6 lg:mb-0">
            <h2 className="text-display-2 text-gray-900 mb-4">
              {t('pages.cv_builder.hero.title')}
            </h2>
            <p className="text-body-large text-gray-600 mb-6">
              {t('pages.cv_builder.hero.description')}
            </p>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {t('pages.cv_builder.completion_progress')}
                </span>
                <span className="text-sm font-bold text-teal-600">
                  {completionPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-teal-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col space-y-3 lg:ms-8">
            <button className="btn-primary">
              <Upload className="h-4 w-4 me-2" />
              {t('pages.cv_builder.upload_existing')}
            </button>
            <button className="btn-secondary">
              <Sparkles className="h-4 w-4 me-2" />
              {t('pages.cv_builder.ai_enhance')}
            </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CV Builder Sections */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {t('pages.cv_builder.build_sections.title')}
            </h3>
            
            <div className="space-y-4">
              {cvSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <div
                    key={section.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isActive 
                        ? 'border-teal-500 bg-teal-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          section.completed 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {section.completed ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {section.title}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="w-20 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  section.completed ? 'bg-green-500' : 'bg-teal-500'
                                }`}
                                style={{ width: `${section.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {section.progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className={`h-5 w-5 text-gray-400 transition-transform ${
                        isActive ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2 mb-6">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                {t('pages.cv_builder.ai_suggestions.title')}
              </h3>
            </div>
            
            <div className="space-y-4">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {suggestion.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {suggestion.description}
                      </p>
                    </div>
                    <button className="btn-primary text-sm px-3 py-1 ms-3">
                      {suggestion.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Templates & Preview */}
        <div className="space-y-8">
          {/* Template Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {t('pages.cv_builder.templates.title')}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="relative group cursor-pointer"
                >
                  {template.popular && (
                    <div className="absolute -top-2 -end-2 z-10">
                      <span className="bg-yellow-400 text-yellow-900 text-xs font-medium px-2 py-1 rounded-full">
                        {t('common.popular')}
                      </span>
                    </div>
                  )}
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-teal-500 transition-colors">
                    <img
                      src={template.preview}
                      alt={template.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <h4 className="font-medium text-gray-900 text-sm mb-1">
                        {template.name}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CV Preview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {t('pages.cv_builder.preview.title')}
              </h3>
              <button className="btn-ghost text-sm">
                <Eye className="h-4 w-4 me-1" />
                {t('pages.cv_builder.preview.full_view')}
              </button>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">
                  {t('pages.cv_builder.preview.placeholder')}
                </p>
                <button className="btn-primary">
                  {t('pages.cv_builder.preview.start_building')}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">
                {t('pages.cv_builder.tips.title')}
              </h3>
            </div>
            
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('pages.cv_builder.tips.tip_1')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('pages.cv_builder.tips.tip_2')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('pages.cv_builder.tips.tip_3')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('pages.cv_builder.tips.tip_4')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-12 text-center bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">
          {t('pages.cv_builder.cta.title')}
        </h2>
        <p className="text-lg mb-6 opacity-90">
          {t('pages.cv_builder.cta.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-teal-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            {t('pages.cv_builder.cta.start_building')}
          </button>
          <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-teal-600 transition-colors">
            {t('pages.cv_builder.cta.view_examples')}
          </button>
        </div>
      </div>
    </UnifiedPageLayout>
  );
};

export default ModernCVBuilder;
