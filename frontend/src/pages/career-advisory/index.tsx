import React from 'react';
import { useTranslation } from 'react-i18next';
import { CareerPageLayout } from '@/components/career/CareerPageLayout';
import { UserCheck, Users, MessageCircle, Award, Mail, Search, Calendar, BookOpen, Target, Star, Clock, TrendingUp, Video, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const CareerAdvisoryPage: React.FC = () => {
  const { t } = useTranslation('career-advisory');

  const stats = [
    { value: "50+", label: t('stats.advisors') },
    { value: "2,000+", label: t('stats.sessions') },
    { value: "95%", label: t('stats.satisfaction') },
    { value: "80%", label: t('stats.achievement') }
  ];

  // Advisory Tab Content
  const AdvisoryTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.advisory.description')}
        </p>
      </div>

      <div className="text-center py-12">
        <UserCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('advisory.title')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('advisory.description')}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <Search className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('advisory.features.matching')}</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <Calendar className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('advisory.features.scheduling')}</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <TrendingUp className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('advisory.features.tracking')}</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <BookOpen className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('advisory.features.resources')}</p>
          </div>
        </div>

        <Badge variant="secondary" className="mb-4">
          {t('advisory.comingSoon')}
        </Badge>
        <br />
        <Button variant="outline">
          <Mail className="h-4 w-4 mr-2" />
          {t('advisory.notifyMe')}
        </Button>
      </div>
    </div>
  );

  // Advisors Tab Content
  const AdvisorsTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.advisors.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['careerTransition', 'leadership', 'entrepreneurship', 'skillDevelopment', 'workLifeBalance', 'networking'].map((specialization) => (
          <Card key={specialization} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="bg-primary/10 rounded-lg p-4 mb-4">
                <UserCheck className="h-8 w-8 mx-auto text-primary" />
              </div>
              <CardTitle className="text-center">
                {t(`advisors.specializations.${specialization}`)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>{t('advisors.profile.experience')}</span>
                  <span>5-15 years</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('advisors.profile.rating')}</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1">4.8</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('advisors.profile.sessions')}</span>
                  <span>50-200</span>
                </div>
              </div>
              <Button className="w-full" variant="outline">
                <Search className="h-4 w-4 mr-2" />
                {t('advisors.actions.viewProfile')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button size="lg">
          <Search className="h-4 w-4 mr-2" />
          {t('primaryAction')}
        </Button>
      </div>
    </div>
  );

  // Sessions Tab Content
  const SessionsTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.sessions.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {t('sessions.upcoming.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-semibold mb-2">{t('sessions.upcoming.empty')}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {t('sessions.upcoming.description')}
              </p>
              <Button size="sm">
                <Search className="h-4 w-4 mr-2" />
                {t('primaryAction')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              {t('sessions.completed.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-semibold mb-2">{t('sessions.completed.empty')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('sessions.completed.description')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['scheduled', 'completed', 'cancelled', 'rescheduled'].map((status) => (
          <Card key={status} className="text-center">
            <CardHeader>
              <div className="bg-primary/10 rounded-lg p-4 mb-2 mx-auto w-fit">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-sm">
                {t(`sessions.status.${status}`)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Resources Tab Content
  const ResourcesTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.resources.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['careerPlanning', 'skillDevelopment', 'leadership', 'networking', 'entrepreneurship', 'workLifeBalance', 'industryInsights', 'personalBranding'].map((category) => (
          <Card key={category} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="bg-primary/10 rounded-lg p-4 mb-4">
                <BookOpen className="h-8 w-8 mx-auto text-primary" />
              </div>
              <CardTitle className="text-center text-sm">
                {t(`resources.categories.${category}`)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <Badge variant="outline" className="text-xs">{t('resources.types.articles')}</Badge>
                <Badge variant="outline" className="text-xs">{t('resources.types.videos')}</Badge>
                <Badge variant="outline" className="text-xs">{t('resources.types.templates')}</Badge>
              </div>
              <Button className="w-full" variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                {t('secondaryAction')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('resources.types.articles')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Career Planning Essentials</span>
                <Badge variant="secondary">New</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Leadership in the Digital Age</span>
                <Badge variant="secondary">Popular</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Networking Strategies</span>
                <Badge variant="secondary">Featured</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('resources.types.videos')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Interview Mastery Course</span>
                <Badge variant="secondary">45 min</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Personal Branding Workshop</span>
                <Badge variant="secondary">30 min</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Career Transition Guide</span>
                <Badge variant="secondary">60 min</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Goals Tab Content
  const GoalsTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.goals.description')}
        </p>
      </div>

      <div className="text-center py-12">
        <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('emptyState.noGoals.title')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('emptyState.noGoals.description')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
          {['shortTerm', 'mediumTerm', 'longTerm'].map((category) => (
            <Card key={category} className="text-center">
              <CardHeader>
                <div className="bg-primary/10 rounded-lg p-4 mb-2 mx-auto w-fit">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-sm">
                  {t(`goals.categories.${category}`)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <Progress value={0} className="w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Button>
          <Target className="h-4 w-4 mr-2" />
          {t('emptyState.noGoals.action')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['skillDevelopment', 'careerAdvancement', 'networking', 'leadership'].map((type) => (
          <Card key={type} className="text-center">
            <CardHeader>
              <div className="bg-primary/10 rounded-lg p-4 mb-2 mx-auto w-fit">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-sm">
                {t(`goals.types.${type}`)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                {t('goals.actions.create')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const tabs = [
    {
      id: 'advisory',
      label: t('tabs.advisory.label'),
      icon: <UserCheck className="h-4 w-4" />,
      content: <AdvisoryTabContent />
    },
    {
      id: 'advisors',
      label: t('tabs.advisors.label'),
      icon: <Users className="h-4 w-4" />,
      content: <AdvisorsTabContent />
    },
    {
      id: 'sessions',
      label: t('tabs.sessions.label'),
      icon: <MessageCircle className="h-4 w-4" />,
      content: <SessionsTabContent />
    },
    {
      id: 'resources',
      label: t('tabs.resources.label'),
      icon: <BookOpen className="h-4 w-4" />,
      content: <ResourcesTabContent />
    },
    {
      id: 'goals',
      label: t('tabs.goals.label'),
      icon: <Target className="h-4 w-4" />,
      content: <GoalsTabContent />
    }
  ];

  return (
    <CareerPageLayout
      title={t('title')}
      description={t('description')}
      heroIcon={<UserCheck className="h-12 w-12" />}
      primaryActionLabel={t('primaryAction')}
      primaryActionIcon={<UserCheck className="h-4 w-4" />}
      secondaryActionLabel={t('secondaryAction')}
      stats={stats}
      quote={t('quote')}
      attribution={t('attribution')}
      quoteIcon={<UserCheck className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="advisory"
    />
  );
};

export default CareerAdvisoryPage;

