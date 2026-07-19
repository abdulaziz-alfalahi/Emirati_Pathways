import React from 'react';
import { useTranslation } from 'react-i18next';
import { CareerPageLayout } from '@/components/career/CareerPageLayout';
import { Briefcase, Users, Building, TrendingUp, Mail, Search, Filter, BookOpen, Network, UserCheck, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const InternshipsPage: React.FC = () => {
  const { t } = useTranslation('internships');

  const stats = [
    { value: "300+", label: t('stats.available') },
    { value: "150+", label: t('stats.companies') },
    { value: "1,200+", label: t('stats.placements') },
    { value: "88%", label: t('stats.conversion') }
  ];

  // Get tips data to avoid i18n array issues
  const getTipsData = () => {
    return [
      {
        title: t('tips.general.0.title', 'Start your search early'),
        description: t('tips.general.0.description', 'Begin looking for internship opportunities 3-6 months before your desired start date')
      },
      {
        title: t('tips.general.1.title', 'Tailor your application'),
        description: t('tips.general.1.description', 'Write a customized cover letter for each internship opportunity you apply to')
      },
      {
        title: t('tips.general.2.title', 'Showcase relevant skills'),
        description: t('tips.general.2.description', 'Highlight projects and practical experiences relevant to the internship field')
      },
      {
        title: t('tips.general.3.title', 'Follow up after applying'),
        description: t('tips.general.3.description', 'Follow up with the company one to two weeks after submitting your application')
      }
    ];
  };

  // Opportunities Tab Content
  const OpportunitiesTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.opportunities.description')}
        </p>
      </div>

      <div className="text-center py-12">
        <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('opportunities.title')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('opportunities.description')}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <Search className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('opportunities.features.matching')}</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <TrendingUp className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('opportunities.features.tracking')}</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <Network className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('opportunities.features.networking')}</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <UserCheck className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('opportunities.features.mentorship')}</p>
          </div>
        </div>

        <Badge variant="secondary" className="mb-4">
          {t('opportunities.comingSoon')}
        </Badge>
        <br />
        <Button variant="outline">
          <Mail className="h-4 w-4 me-2" />
          {t('opportunities.notifyMe')}
        </Button>
      </div>
    </div>
  );

  // Applications Tab Content
  const ApplicationsTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.applications.description')}
        </p>
      </div>

      <div className="text-center py-12">
        <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('applications.empty.title')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('applications.empty.description')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
          {['pending', 'approved', 'rejected', 'withdrawn'].map((status) => (
            <Card key={status} className="text-center">
              <CardHeader>
                <div className="bg-primary/10 rounded-lg p-4 mb-2 mx-auto w-fit">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-sm">
                  {t(`applications.status.${status}`)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button>
          <Search className="h-4 w-4 me-2" />
          {t('applications.empty.action')}
        </Button>
      </div>
    </div>
  );

  // Saved Tab Content
  const SavedTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.saved.description')}
        </p>
      </div>

      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('saved.empty.title')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('saved.empty.description')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
          {['save', 'unsave', 'apply'].map((action) => (
            <div key={action} className="text-center">
              <div className="bg-primary/10 rounded-lg p-4 mb-2">
                <BookOpen className="h-6 w-6 mx-auto text-primary" />
              </div>
              <p className="text-sm font-medium">{t(`saved.actions.${action}`)}</p>
            </div>
          ))}
        </div>

        <Button>
          <Search className="h-4 w-4 me-2" />
          {t('saved.empty.action')}
        </Button>
      </div>
    </div>
  );

  // Tips Tab Content
  const TipsTabContent = () => {
    const tipsData = getTipsData();
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('tabs.tips.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tipsData.map((tip, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 rounded-lg p-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{tip.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{tip.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['application', 'interview', 'networking', 'performance'].map((category) => (
            <Card key={category} className="text-center">
              <CardHeader>
                <div className="bg-primary/10 rounded-lg p-4 mb-2 mx-auto w-fit">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-sm">
                  {t(`tips.categories.${category}`)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full">
                  {t('secondaryAction')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const tabs = [
    {
      id: 'opportunities',
      label: t('tabs.opportunities.label'),
      icon: <Briefcase className="h-4 w-4" />,
      content: <OpportunitiesTabContent />
    },
    {
      id: 'applications',
      label: t('tabs.applications.label'),
      icon: <Users className="h-4 w-4" />,
      content: <ApplicationsTabContent />
    },
    {
      id: 'saved',
      label: t('tabs.saved.label'),
      icon: <BookOpen className="h-4 w-4" />,
      content: <SavedTabContent />
    },
    {
      id: 'tips',
      label: t('tabs.tips.label'),
      icon: <Lightbulb className="h-4 w-4" />,
      content: <TipsTabContent />
    }
  ];

  return (
    <CareerPageLayout
      title={t('title')}
      description={t('description')}
      heroIcon={<Briefcase className="h-12 w-12" />}
      primaryActionLabel={t('primaryAction')}
      primaryActionIcon={<Briefcase className="h-4 w-4" />}
      secondaryActionLabel={t('secondaryAction')}
      stats={stats}
      quote={t('quote')}
      attribution={t('attribution')}
      quoteIcon={<Briefcase className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="opportunities"
    />
  );
};

export default InternshipsPage;

