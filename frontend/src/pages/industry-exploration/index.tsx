import React from 'react';
import { useTranslation } from 'react-i18next';
import { CareerPageLayout } from '@/components/career/CareerPageLayout';
import { 
  Building2, 
  TrendingUp, 
  MapPin, 
  Users, 
  Briefcase, 
  DollarSign, 
  BarChart3,
  Factory,
  Stethoscope,
  Cpu,
  Banknote,
  Plane,
  HardHat,
  ShoppingBag,
  GraduationCap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const IndustryExplorationPage: React.FC = () => {
  const { t } = useTranslation('industry-exploration');

  const stats = [
    { 
      value: t('stats.industries.value'), 
      label: t('stats.industries.label'), 
      icon: Building2 
    },
    { 
      value: t('stats.companies.value'), 
      label: t('stats.companies.label'), 
      icon: Factory 
    },
    { 
      value: t('stats.jobOpenings.value'), 
      label: t('stats.jobOpenings.label'), 
      icon: Briefcase 
    },
    { 
      value: t('stats.averageSalary.value'), 
      label: t('stats.averageSalary.label'), 
      icon: DollarSign 
    }
  ];

  const industries = [
    {
      key: 'technology',
      title: t('industries.technology.title'),
      description: t('industries.technology.description'),
      growth: t('industries.technology.growth'),
      averageSalary: t('industries.technology.averageSalary'),
      jobCount: t('industries.technology.jobCount'),
      keySkills: t('industries.technology.keySkills', { returnObjects: true }) as string[],
      majorCompanies: t('industries.technology.majorCompanies', { returnObjects: true }) as string[],
      icon: <Cpu className="h-8 w-8 text-blue-600" />
    },
    {
      key: 'finance',
      title: t('industries.finance.title'),
      description: t('industries.finance.description'),
      growth: t('industries.finance.growth'),
      averageSalary: t('industries.finance.averageSalary'),
      jobCount: t('industries.finance.jobCount'),
      keySkills: t('industries.finance.keySkills', { returnObjects: true }) as string[],
      majorCompanies: t('industries.finance.majorCompanies', { returnObjects: true }) as string[],
      icon: <Banknote className="h-8 w-8 text-green-600" />
    },
    {
      key: 'healthcare',
      title: t('industries.healthcare.title'),
      description: t('industries.healthcare.description'),
      growth: t('industries.healthcare.growth'),
      averageSalary: t('industries.healthcare.averageSalary'),
      jobCount: t('industries.healthcare.jobCount'),
      keySkills: t('industries.healthcare.keySkills', { returnObjects: true }) as string[],
      majorCompanies: t('industries.healthcare.majorCompanies', { returnObjects: true }) as string[],
      icon: <Stethoscope className="h-8 w-8 text-red-600" />
    },
    {
      key: 'energy',
      title: t('industries.energy.title'),
      description: t('industries.energy.description'),
      growth: t('industries.energy.growth'),
      averageSalary: t('industries.energy.averageSalary'),
      jobCount: t('industries.energy.jobCount'),
      keySkills: t('industries.energy.keySkills', { returnObjects: true }) as string[],
      majorCompanies: t('industries.energy.majorCompanies', { returnObjects: true }) as string[],
      icon: <BarChart3 className="h-8 w-8 text-yellow-600" />
    },
    {
      key: 'tourism',
      title: t('industries.tourism.title'),
      description: t('industries.tourism.description'),
      growth: t('industries.tourism.growth'),
      averageSalary: t('industries.tourism.averageSalary'),
      jobCount: t('industries.tourism.jobCount'),
      keySkills: t('industries.tourism.keySkills', { returnObjects: true }) as string[],
      majorCompanies: t('industries.tourism.majorCompanies', { returnObjects: true }) as string[],
      icon: <Plane className="h-8 w-8 text-purple-600" />
    },
    {
      key: 'construction',
      title: t('industries.construction.title'),
      description: t('industries.construction.description'),
      growth: t('industries.construction.growth'),
      averageSalary: t('industries.construction.averageSalary'),
      jobCount: t('industries.construction.jobCount'),
      keySkills: t('industries.construction.keySkills', { returnObjects: true }) as string[],
      majorCompanies: t('industries.construction.majorCompanies', { returnObjects: true }) as string[],
      icon: <HardHat className="h-8 w-8 text-orange-600" />
    }
  ];

  const trends = [
    {
      key: 'digitalTransformation',
      title: t('trends.digitalTransformation.title'),
      description: t('trends.digitalTransformation.description'),
      impact: t('trends.digitalTransformation.impact'),
      timeline: t('trends.digitalTransformation.timeline')
    },
    {
      key: 'sustainability',
      title: t('trends.sustainability.title'),
      description: t('trends.sustainability.description'),
      impact: t('trends.sustainability.impact'),
      timeline: t('trends.sustainability.timeline')
    },
    {
      key: 'artificialIntelligence',
      title: t('trends.artificialIntelligence.title'),
      description: t('trends.artificialIntelligence.description'),
      impact: t('trends.artificialIntelligence.impact'),
      timeline: t('trends.artificialIntelligence.timeline')
    },
    {
      key: 'remoteWork',
      title: t('trends.remoteWork.title'),
      description: t('trends.remoteWork.description'),
      impact: t('trends.remoteWork.impact'),
      timeline: t('trends.remoteWork.timeline')
    }
  ];

  const regions = [
    {
      key: 'dubai',
      name: t('regions.dubai.name'),
      industries: t('regions.dubai.industries', { returnObjects: true }) as string[],
      jobCount: t('regions.dubai.jobCount'),
      growth: t('regions.dubai.growth')
    },
    {
      key: 'abudhabi',
      name: t('regions.abudhabi.name'),
      industries: t('regions.abudhabi.industries', { returnObjects: true }) as string[],
      jobCount: t('regions.abudhabi.jobCount'),
      growth: t('regions.abudhabi.growth')
    },
    {
      key: 'sharjah',
      name: t('regions.sharjah.name'),
      industries: t('regions.sharjah.industries', { returnObjects: true }) as string[],
      jobCount: t('regions.sharjah.jobCount'),
      growth: t('regions.sharjah.growth')
    },
    {
      key: 'northernEmirates',
      name: t('regions.northernEmirates.name'),
      industries: t('regions.northernEmirates.industries', { returnObjects: true }) as string[],
      jobCount: t('regions.northernEmirates.jobCount'),
      growth: t('regions.northernEmirates.growth')
    }
  ];

  const tabs = [
    {
      id: "overview",
      label: t('tabs.overview'),
      icon: <Building2 className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Building2 className="h-16 w-16 mx-auto text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('tabs.overview')}</h3>
            <p className="text-muted-foreground mb-4">{t('description')}</p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4 text-center">
                  <stat.icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "sectors",
      label: t('tabs.sectors'),
      icon: <Factory className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Factory className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('tabs.sectors')}</h3>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {industries.map((industry, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {industry.icon}
                    <CardTitle className="text-lg">{industry.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{industry.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">{t('labels.growth')}:</span>
                        <div className="text-green-600">{industry.growth}</div>
                      </div>
                      <div>
                        <span className="font-medium">{t('labels.salary')}:</span>
                        <div className="text-blue-600">{industry.averageSalary}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{industry.jobCount} {t('labels.jobs')}</span>
                      <Badge variant="secondary">{industry.growth} {t('labels.growth')}</Badge>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium">{t('labels.skills')}:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {industry.keySkills.slice(0, 3).map((skill, skillIndex) => (
                          <Badge key={skillIndex} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button className="w-full">{t('buttons.exploreIndustry')}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "trends",
      label: t('tabs.trends'),
      icon: <TrendingUp className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <TrendingUp className="h-16 w-16 mx-auto text-purple-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('trends.title')}</h3>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {trends.map((trend, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{trend.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{trend.description}</p>
                    <div className="flex justify-between text-sm">
                      <span><strong>{t('labels.impact')}:</strong> {trend.impact}</span>
                      <span><strong>{t('labels.timeline')}:</strong> {trend.timeline}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "opportunities",
      label: t('tabs.opportunities'),
      icon: <Briefcase className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Briefcase className="h-16 w-16 mx-auto text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('opportunities.title')}</h3>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{t('opportunities.startups.count')}</div>
                <div className="text-sm text-muted-foreground">{t('opportunities.startups.title')}</div>
                <div className="text-xs text-green-600 mt-1">{t('opportunities.startups.funding')} {t('labels.funding')}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{t('opportunities.freelancing.professionals')}</div>
                <div className="text-sm text-muted-foreground">{t('opportunities.freelancing.title')}</div>
                <div className="text-xs text-blue-600 mt-1">{t('opportunities.freelancing.growth')} {t('labels.growth')}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{t('opportunities.internships.programs')}</div>
                <div className="text-sm text-muted-foreground">{t('opportunities.internships.title')}</div>
                <div className="text-xs text-orange-600 mt-1">{t('opportunities.internships.participants')} {t('labels.participants')}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{regions.reduce((sum, region) => sum + parseInt(region.jobCount.replace(/[^\d]/g, '')), 0).toLocaleString()}+</div>
                <div className="text-sm text-muted-foreground">{t('regions.title')}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {regions.map((region, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {region.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium">{t('labels.jobs')}:</span> {region.jobCount}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{t('labels.growth')}:</span> 
                      <span className="text-green-600 ml-1">{region.growth}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">{t('labels.industries')}:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {region.industries.slice(0, 2).map((industry, industryIndex) => (
                          <Badge key={industryIndex} variant="outline" className="text-xs">
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    }
  ];

  return (
    <CareerPageLayout
      title={t('title')}
      description={t('description')}
      heroIcon={<Building2 className="h-12 w-12" />}
      primaryActionLabel={t('buttons.exploreIndustry')}
      primaryActionIcon={<Building2 className="h-4 w-4" />}
      secondaryActionLabel={t('buttons.viewJobs')}
      stats={stats}
      quote={t('trends.title')}
      attribution="D33 and Talent33"
      quoteIcon={<TrendingUp className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  );
};

export default IndustryExplorationPage;

