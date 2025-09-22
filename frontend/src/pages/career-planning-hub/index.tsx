import React from 'react';
import { useTranslation } from 'react-i18next';
import { CareerPageLayout } from '@/components/career/CareerPageLayout';
import { Compass, Target, TrendingUp, Users, Briefcase, Award, Network, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const CareerPlanningHubPage: React.FC = () => {
  const { t } = useTranslation('career-planning-hub');

  const stats = [
    { 
      value: t('stats.careerPaths.value'), 
      label: t('stats.careerPaths.label'), 
      icon: Compass 
    },
    { 
      value: t('stats.jobOpportunities.value'), 
      label: t('stats.jobOpportunities.label'), 
      icon: Briefcase 
    },
    { 
      value: t('stats.industryPartners.value'), 
      label: t('stats.industryPartners.label'), 
      icon: Users 
    },
    { 
      value: t('stats.successStories.value'), 
      label: t('stats.successStories.label'), 
      icon: Award 
    }
  ];

  const careerPaths = [
    {
      title: t('careerPaths.technology.title'),
      description: t('careerPaths.technology.description'),
      averageSalary: t('careerPaths.technology.averageSalary'),
      growthRate: t('careerPaths.technology.growthRate'),
      jobCount: t('careerPaths.technology.jobCount'),
      icon: <TrendingUp className="h-8 w-8 text-blue-600" />
    },
    {
      title: t('careerPaths.healthcare.title'),
      description: t('careerPaths.healthcare.description'),
      averageSalary: t('careerPaths.healthcare.averageSalary'),
      growthRate: t('careerPaths.healthcare.growthRate'),
      jobCount: t('careerPaths.healthcare.jobCount'),
      icon: <Users className="h-8 w-8 text-green-600" />
    },
    {
      title: t('careerPaths.business.title'),
      description: t('careerPaths.business.description'),
      averageSalary: t('careerPaths.business.averageSalary'),
      growthRate: t('careerPaths.business.growthRate'),
      jobCount: t('careerPaths.business.jobCount'),
      icon: <Briefcase className="h-8 w-8 text-purple-600" />
    },
    {
      title: t('careerPaths.engineering.title'),
      description: t('careerPaths.engineering.description'),
      averageSalary: t('careerPaths.engineering.averageSalary'),
      growthRate: t('careerPaths.engineering.growthRate'),
      jobCount: t('careerPaths.engineering.jobCount'),
      icon: <Target className="h-8 w-8 text-orange-600" />
    },
    {
      title: t('careerPaths.education.title'),
      description: t('careerPaths.education.description'),
      averageSalary: t('careerPaths.education.averageSalary'),
      growthRate: t('careerPaths.education.growthRate'),
      jobCount: t('careerPaths.education.jobCount'),
      icon: <Award className="h-8 w-8 text-red-600" />
    },
    {
      title: t('careerPaths.finance.title'),
      description: t('careerPaths.finance.description'),
      averageSalary: t('careerPaths.finance.averageSalary'),
      growthRate: t('careerPaths.finance.growthRate'),
      jobCount: t('careerPaths.finance.jobCount'),
      icon: <BarChart3 className="h-8 w-8 text-yellow-600" />
    }
  ];

  const skillCategories = [
    {
      title: t('skills.technical.title'),
      items: t('skills.technical.items', { returnObjects: true }) as string[]
    },
    {
      title: t('skills.soft.title'),
      items: t('skills.soft.items', { returnObjects: true }) as string[]
    },
    {
      title: t('skills.language.title'),
      items: t('skills.language.items', { returnObjects: true }) as string[]
    }
  ];

  const assessmentCategories = [
    {
      title: t('assessment.categories.personality'),
      description: t('assessment.description'),
      progress: 85,
      icon: <Users className="h-6 w-6 text-blue-600" />
    },
    {
      title: t('assessment.categories.skills'),
      description: t('assessment.description'),
      progress: 70,
      icon: <Target className="h-6 w-6 text-green-600" />
    },
    {
      title: t('assessment.categories.interests'),
      description: t('assessment.description'),
      progress: 90,
      icon: <Compass className="h-6 w-6 text-purple-600" />
    },
    {
      title: t('assessment.categories.values'),
      description: t('assessment.description'),
      progress: 75,
      icon: <Award className="h-6 w-6 text-orange-600" />
    }
  ];

  const tabs = [
    {
      id: "career-explorer",
      label: t('tabs.careerExplorer'),
      icon: <Compass className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Compass className="h-16 w-16 mx-auto text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('tabs.careerExplorer')}</h3>
            <p className="text-muted-foreground mb-4">{t('description')}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {careerPaths.map((path, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {path.icon}
                    <CardTitle className="text-lg">{path.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{path.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">{t('labels.salary')}:</span>
                        <div className="text-green-600">{path.averageSalary}</div>
                      </div>
                      <div>
                        <span className="font-medium">{t('labels.growth')}:</span>
                        <div className="text-blue-600">{path.growthRate}</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{path.jobCount} {t('labels.jobs')}</span>
                      <Badge variant="secondary">{t('labels.growth')}: {path.growthRate}</Badge>
                    </div>
                    <Button className="w-full">{t('buttons.explorecareers')}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "skill-assessment",
      label: t('tabs.skillAssessment'),
      icon: <Target className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Target className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('assessment.title')}</h3>
            <p className="text-muted-foreground mb-4">{t('assessment.description')}</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {assessmentCategories.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {category.icon}
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>{t('labels.progress')}</span>
                        <span>{category.progress}%</span>
                      </div>
                      <Progress value={category.progress} />
                    </div>
                    <Button className="w-full">{t('buttons.takeAssessment')}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {skillCategories.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "job-market",
      label: t('tabs.jobMarket'),
      icon: <TrendingUp className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <TrendingUp className="h-16 w-16 mx-auto text-purple-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('jobMarket.title')}</h3>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">2,500+</div>
                <div className="text-sm text-muted-foreground">{t('jobMarket.trending')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">1,200+</div>
                <div className="text-sm text-muted-foreground">{t('jobMarket.remote')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">800+</div>
                <div className="text-sm text-muted-foreground">{t('jobMarket.fullTime')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">300+</div>
                <div className="text-sm text-muted-foreground">{t('jobMarket.internship')}</div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg">{t('buttons.viewJobs')}</Button>
          </div>
        </div>
      )
    },
    {
      id: "networking",
      label: t('tabs.networking'),
      icon: <Network className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Network className="h-16 w-16 mx-auto text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('networking.title')}</h3>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>{t('networking.events')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{t('events.title')}</p>
                <Button className="w-full">{t('buttons.viewJobs')}</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('networking.mentorship')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{t('mentorship.title')}</p>
                <Button className="w-full">{t('mentorship.findMentor')}</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('networking.alumni')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{t('success.graduates')}</p>
                <Button className="w-full">{t('buttons.buildNetwork')}</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }
  ];

  return (
    <CareerPageLayout
      title={t('title')}
      description={t('description')}
      heroIcon={<Compass className="h-12 w-12" />}
      primaryActionLabel={t('buttons.explorecareers')}
      primaryActionIcon={<Target className="h-4 w-4" />}
      secondaryActionLabel={t('resources.title')}
      stats={stats}
      quote={t('success.inspiration')}
      attribution="Bobby Unser"
      quoteIcon={<Target className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="career-explorer"
    />
  );
};

export default CareerPlanningHubPage;

