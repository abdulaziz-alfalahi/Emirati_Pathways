import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  Cpu, 
  Heart, 
  GraduationCap, 
  Banknote, 
  Plane,
  Search,
  Filter,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { UnifiedPageLayout } from '../../components/design-system/UnifiedPageLayout';
import { StandardCard, FeatureCard, StatsCard } from '../../components/design-system/StandardCard';
import '../../styles/design-system.css';

const ModernIndustryExploration: React.FC = () => {
  const { t } = useTranslation();
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const breadcrumbs = [
    { label: t('navigation.career_entry') },
    { label: t('pages.industry_exploration.title') }
  ];

  const industries = [
    {
      id: 'technology',
      title: t('pages.industry_exploration.industries.technology.title'),
      description: t('pages.industry_exploration.industries.technology.description'),
      icon: Cpu,
      color: 'from-blue-500 to-blue-600',
      jobCount: '2,500+',
      avgSalary: 'AED 25,000 - 45,000',
      growthRate: '+18%',
      topCompanies: ['Emirates NBD', 'du', 'Careem', 'Noon', 'Talabat'],
      keyRoles: [
        'Software Engineer',
        'Data Scientist', 
        'AI Specialist',
        'Cybersecurity Analyst',
        'Cloud Architect'
      ],
      skills: [
        'Python/JavaScript',
        'Machine Learning',
        'Cloud Computing',
        'DevOps',
        'Mobile Development'
      ]
    },
    {
      id: 'healthcare',
      title: t('pages.industry_exploration.industries.healthcare.title'),
      description: t('pages.industry_exploration.industries.healthcare.description'),
      icon: Heart,
      color: 'from-green-500 to-green-600',
      jobCount: '1,800+',
      avgSalary: 'AED 20,000 - 40,000',
      growthRate: '+15%',
      topCompanies: ['Cleveland Clinic', 'Mediclinic', 'NMC Healthcare', 'Aster DM', 'VPS Healthcare'],
      keyRoles: [
        'Registered Nurse',
        'Medical Technologist',
        'Healthcare Administrator',
        'Pharmacist',
        'Physical Therapist'
      ],
      skills: [
        'Patient Care',
        'Medical Technology',
        'Healthcare Management',
        'Clinical Research',
        'Health Informatics'
      ]
    },
    {
      id: 'finance',
      title: t('pages.industry_exploration.industries.finance.title'),
      description: t('pages.industry_exploration.industries.finance.description'),
      icon: Banknote,
      color: 'from-yellow-500 to-yellow-600',
      jobCount: '1,500+',
      avgSalary: 'AED 22,000 - 38,000',
      growthRate: '+12%',
      topCompanies: ['Emirates NBD', 'ADCB', 'FAB', 'ENBD REIT', 'Dubai Islamic Bank'],
      keyRoles: [
        'Financial Analyst',
        'Investment Advisor',
        'Risk Manager',
        'Compliance Officer',
        'Wealth Manager'
      ],
      skills: [
        'Financial Analysis',
        'Risk Assessment',
        'Investment Planning',
        'Regulatory Compliance',
        'Portfolio Management'
      ]
    },
    {
      id: 'education',
      title: t('pages.industry_exploration.industries.education.title'),
      description: t('pages.industry_exploration.industries.education.description'),
      icon: GraduationCap,
      color: 'from-purple-500 to-purple-600',
      jobCount: '1,200+',
      avgSalary: 'AED 15,000 - 30,000',
      growthRate: '+10%',
      topCompanies: ['KHDA', 'ADEK', 'Higher Colleges of Technology', 'AUS', 'NYU Abu Dhabi'],
      keyRoles: [
        'Teacher',
        'Curriculum Developer',
        'Educational Administrator',
        'Learning Specialist',
        'Academic Coordinator'
      ],
      skills: [
        'Curriculum Design',
        'Educational Technology',
        'Student Assessment',
        'Classroom Management',
        'Learning Analytics'
      ]
    },
    {
      id: 'aviation',
      title: t('pages.industry_exploration.industries.aviation.title'),
      description: t('pages.industry_exploration.industries.aviation.description'),
      icon: Plane,
      color: 'from-red-500 to-red-600',
      jobCount: '900+',
      avgSalary: 'AED 18,000 - 35,000',
      growthRate: '+8%',
      topCompanies: ['Emirates', 'Etihad Airways', 'flydubai', 'Dubai Airports', 'ADAC'],
      keyRoles: [
        'Pilot',
        'Flight Attendant',
        'Aircraft Maintenance Engineer',
        'Air Traffic Controller',
        'Airport Operations Manager'
      ],
      skills: [
        'Aviation Safety',
        'Aircraft Systems',
        'Customer Service',
        'Emergency Procedures',
        'Aviation Regulations'
      ]
    },
    {
      id: 'construction',
      title: t('pages.industry_exploration.industries.construction.title'),
      description: t('pages.industry_exploration.industries.construction.description'),
      icon: Building2,
      color: 'from-orange-500 to-orange-600',
      jobCount: '2,000+',
      avgSalary: 'AED 20,000 - 42,000',
      growthRate: '+14%',
      topCompanies: ['Emaar', 'DAMAC', 'Aldar', 'Arabtec', 'Drake & Scull'],
      keyRoles: [
        'Civil Engineer',
        'Project Manager',
        'Architect',
        'Construction Manager',
        'Quantity Surveyor'
      ],
      skills: [
        'Project Management',
        'AutoCAD/BIM',
        'Construction Planning',
        'Quality Control',
        'Safety Management'
      ]
    }
  ];

  const filteredIndustries = industries.filter(industry =>
    industry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    industry.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    {
      title: t('pages.industry_exploration.stats.total_industries'),
      value: '15+',
      change: 'Major sectors',
      changeType: 'neutral' as const,
      icon: Building2
    },
    {
      title: t('pages.industry_exploration.stats.job_opportunities'),
      value: '12,000+',
      change: '+8% this quarter',
      changeType: 'positive' as const,
      icon: TrendingUp
    },
    {
      title: t('pages.industry_exploration.stats.companies'),
      value: '500+',
      change: 'Partner companies',
      changeType: 'neutral' as const,
      icon: Users
    },
    {
      title: t('pages.industry_exploration.stats.avg_salary'),
      value: 'AED 28K',
      change: 'Average salary',
      changeType: 'positive' as const,
      icon: Star
    }
  ];

  return (
    <UnifiedPageLayout
      title={t('pages.industry_exploration.title')}
      subtitle={t('pages.industry_exploration.subtitle')}
      breadcrumbs={breadcrumbs}
      headerActions={
        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            {t('common.filter')}
          </button>
          <button className="btn-primary">
            {t('pages.industry_exploration.explore_all')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      }
    >
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8 mb-12">
        <div className="max-w-3xl">
          <h2 className="text-display-2 text-gray-900 mb-4">
            {t('pages.industry_exploration.hero.title')}
          </h2>
          <p className="text-body-large text-gray-600 mb-6">
            {t('pages.industry_exploration.hero.description')}
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('pages.industry_exploration.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
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

      {/* Industries Grid */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-display-2 text-gray-900 mb-4">
            {t('pages.industry_exploration.industries.title')}
          </h2>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto">
            {t('pages.industry_exploration.industries.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredIndustries.map((industry) => {
            const Icon = industry.icon;
            const isSelected = selectedIndustry === industry.id;
            
            return (
              <div
                key={industry.id}
                className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer ${
                  isSelected ? 'ring-2 ring-teal-500 ring-offset-2' : ''
                }`}
                onClick={() => setSelectedIndustry(isSelected ? null : industry.id)}
              >
                {/* Industry Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${industry.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {industry.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  {industry.description}
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{industry.jobCount}</div>
                    <div className="text-xs text-gray-500">{t('common.jobs')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{industry.growthRate}</div>
                    <div className="text-xs text-gray-500">{t('common.growth')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {industry.avgSalary.split(' - ')[0].replace('AED ', '')}K
                    </div>
                    <div className="text-xs text-gray-500">{t('common.salary')}</div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isSelected && (
                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-6 animate-in slide-in-from-top-2 duration-300">
                    {/* Top Companies */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        {t('pages.industry_exploration.top_companies')}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {industry.topCompanies.map((company, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {company}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Key Roles */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        {t('pages.industry_exploration.key_roles')}
                      </h4>
                      <div className="space-y-2">
                        {industry.keyRoles.slice(0, 3).map((role, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-teal-600 rounded-full"></div>
                            <span className="text-sm text-gray-600">{role}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Required Skills */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        {t('pages.industry_exploration.required_skills')}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {industry.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button className="flex-1 btn-primary text-sm py-2">
                        {t('pages.industry_exploration.view_jobs')}
                      </button>
                      <button className="flex-1 btn-secondary text-sm py-2">
                        {t('pages.industry_exploration.learn_more')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Industry Insights Section */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-display-2 text-gray-900 mb-4">
            {t('pages.industry_exploration.insights.title')}
          </h2>
          <p className="text-body-large text-gray-600">
            {t('pages.industry_exploration.insights.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            title={t('pages.industry_exploration.insights.market_trends.title')}
            description={t('pages.industry_exploration.insights.market_trends.description')}
            icon={TrendingUp}
            features={[
              t('pages.industry_exploration.insights.market_trends.features.0'),
              t('pages.industry_exploration.insights.market_trends.features.1'),
              t('pages.industry_exploration.insights.market_trends.features.2'),
              t('pages.industry_exploration.insights.market_trends.features.3')
            ]}
            href="/market-trends"
            ctaText={t('common.view_trends')}
          />

          <FeatureCard
            title={t('pages.industry_exploration.insights.salary_guide.title')}
            description={t('pages.industry_exploration.insights.salary_guide.description')}
            icon={Banknote}
            features={[
              t('pages.industry_exploration.insights.salary_guide.features.0'),
              t('pages.industry_exploration.insights.salary_guide.features.1'),
              t('pages.industry_exploration.insights.salary_guide.features.2'),
              t('pages.industry_exploration.insights.salary_guide.features.3')
            ]}
            href="/salary-guide"
            ctaText={t('common.view_salaries')}
          />

          <FeatureCard
            title={t('pages.industry_exploration.insights.skill_demand.title')}
            description={t('pages.industry_exploration.insights.skill_demand.description')}
            icon={Users}
            features={[
              t('pages.industry_exploration.insights.skill_demand.features.0'),
              t('pages.industry_exploration.insights.skill_demand.features.1'),
              t('pages.industry_exploration.insights.skill_demand.features.2'),
              t('pages.industry_exploration.insights.skill_demand.features.3')
            ]}
            href="/skill-demand"
            ctaText={t('common.view_skills')}
          />
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">
          {t('pages.industry_exploration.cta.title')}
        </h2>
        <p className="text-lg mb-6 opacity-90">
          {t('pages.industry_exploration.cta.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-teal-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            {t('pages.industry_exploration.cta.start_assessment')}
          </button>
          <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-teal-600 transition-colors">
            {t('pages.industry_exploration.cta.browse_jobs')}
          </button>
        </div>
      </div>
    </UnifiedPageLayout>
  );
};

export default ModernIndustryExploration;
