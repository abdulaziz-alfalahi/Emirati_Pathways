import React from 'react';
import { useTranslation } from 'react-i18next';
import { CareerPageLayout } from '@/components/career/CareerPageLayout';
import { User, Globe, Image, Award, BarChart3, Settings, FolderOpen, Eye, Mail, Download, Share2, Copy, Monitor, Smartphone, Tablet, Lock, Key, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const PortfolioPage: React.FC = () => {
  const { t } = useTranslation('portfolio');

  const stats = [
    { value: "15+", label: t('stats.templates') },
    { value: "3,000+", label: t('stats.created') },
    { value: "25+", label: t('stats.industries') },
    { value: "90%", label: t('stats.success') }
  ];

  // Portfolio Tab Content
  const PortfolioTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.portfolio.description')}
        </p>
      </div>

      <div className="text-center py-12">
        <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('emptyState.title')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('emptyState.description')}
        </p>
        <Button>
          <FolderOpen className="h-4 w-4 mr-2" />
          {t('emptyState.createFirst')}
        </Button>
      </div>
    </div>
  );

  // Builder Tab Content
  const BuilderTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.builder.description')}
        </p>
      </div>

      <div className="text-center py-12">
        <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('builder.title')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('builder.description')}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <Settings className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('builder.features.dragDrop')}</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <Image className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('builder.features.customizable')}</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <Monitor className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('builder.features.responsive')}</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <User className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('builder.features.professional')}</p>
          </div>
        </div>

        <Badge variant="secondary" className="mb-4">
          {t('builder.comingSoon')}
        </Badge>
        <br />
        <Button variant="outline">
          <Mail className="h-4 w-4 mr-2" />
          {t('builder.notifyMe')}
        </Button>
      </div>
    </div>
  );

  // Templates Tab Content
  const TemplatesTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.templates.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['creative', 'business', 'technical', 'academic'].map((category) => (
          <Card key={category} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="bg-primary/10 rounded-lg p-4 mb-4">
                <Image className="h-8 w-8 mx-auto text-primary" />
              </div>
              <CardTitle className="text-center">
                {t(`templates.categories.${category}`)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <Badge variant="outline">{t('templates.features.responsive')}</Badge>
                <Badge variant="outline">{t('templates.features.customizable')}</Badge>
                <Badge variant="outline">{t('templates.features.modern')}</Badge>
                <Badge variant="outline">{t('templates.features.professional')}</Badge>
              </div>
              <Button className="w-full" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                {t('secondaryAction')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Analytics Tab Content
  const AnalyticsTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.analytics.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { key: 'views', icon: Eye, value: '1,234' },
          { key: 'visitors', icon: Users, value: '892' },
          { key: 'downloads', icon: Download, value: '156' },
          { key: 'shares', icon: Share2, value: '89' },
          { key: 'contacts', icon: Mail, value: '23' },
          { key: 'engagement', icon: TrendingUp, value: '67%' }
        ].map((metric) => (
          <Card key={metric.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t(`analytics.metrics.${metric.key}`)}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.insights.topPages')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">{t('portfolio.sections.about')}</span>
                <span className="text-sm text-muted-foreground">45%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">{t('portfolio.sections.projects')}</span>
                <span className="text-sm text-muted-foreground">32%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">{t('portfolio.sections.experience')}</span>
                <span className="text-sm text-muted-foreground">23%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.insights.devices')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Monitor className="h-4 w-4 mr-2" />
                  <span className="text-sm">Desktop</span>
                </div>
                <span className="text-sm text-muted-foreground">52%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Smartphone className="h-4 w-4 mr-2" />
                  <span className="text-sm">Mobile</span>
                </div>
                <span className="text-sm text-muted-foreground">38%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Tablet className="h-4 w-4 mr-2" />
                  <span className="text-sm">Tablet</span>
                </div>
                <span className="text-sm text-muted-foreground">10%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Visibility Tab Content
  const VisibilityTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.visibility.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('visibility.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'public', icon: Globe },
              { key: 'private', icon: Lock },
              { key: 'linkOnly', icon: Globe },
              { key: 'password', icon: Key }
            ].map((option) => (
              <div key={option.key} className="flex items-center space-x-3 p-3 border rounded-lg">
                <option.icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">
                    {t(`visibility.options.${option.key}.title`)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t(`visibility.options.${option.key}.description`)}
                  </div>
                </div>
                <Switch />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('visibility.sharing.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Copy className="h-4 w-4 mr-2" />
              {t('visibility.sharing.copyLink')}
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Mail className="h-4 w-4 mr-2" />
              {t('visibility.sharing.shareEmail')}
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Share2 className="h-4 w-4 mr-2" />
              {t('visibility.sharing.shareLinkedIn')}
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Share2 className="h-4 w-4 mr-2" />
              {t('visibility.sharing.shareTwitter')}
            </Button>
            <Separator />
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              {t('visibility.sharing.downloadPDF')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const tabs = [
    {
      id: 'portfolio',
      label: t('tabs.portfolio.label'),
      icon: <User className="h-4 w-4" />,
      content: <PortfolioTabContent />
    },
    {
      id: 'builder',
      label: t('tabs.builder.label'),
      icon: <FolderOpen className="h-4 w-4" />,
      content: <BuilderTabContent />
    },
    {
      id: 'templates',
      label: t('tabs.templates.label'),
      icon: <Image className="h-4 w-4" />,
      content: <TemplatesTabContent />
    },
    {
      id: 'analytics',
      label: t('tabs.analytics.label'),
      icon: <BarChart3 className="h-4 w-4" />,
      content: <AnalyticsTabContent />
    },
    {
      id: 'visibility',
      label: t('tabs.visibility.label'),
      icon: <Settings className="h-4 w-4" />,
      content: <VisibilityTabContent />
    }
  ];

  return (
    <CareerPageLayout
      title={t('title')}
      description={t('description')}
      heroIcon={<User className="h-12 w-12" />}
      primaryActionLabel={t('primaryAction')}
      primaryActionIcon={<User className="h-4 w-4" />}
      secondaryActionLabel={t('secondaryAction')}
      stats={stats}
      quote={t('quote')}
      attribution={t('attribution')}
      quoteIcon={<User className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="portfolio"
    />
  );
};

export default PortfolioPage;

