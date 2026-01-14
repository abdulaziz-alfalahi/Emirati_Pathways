import React from 'react';
import { useTranslation } from 'react-i18next';
import { CareerPageLayout } from '@/components/career/CareerPageLayout';
import { Search, Target, Users, TrendingUp, Briefcase, MapPin, Coins, Star, Clock, Building, Eye, Heart, Send, Filter, BookmarkPlus, Bell, BarChart3, User, Settings, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const JobMatchingPage: React.FC = () => {
  const { t } = useTranslation('jobs');

  const stats = [
    { value: "5,000+", label: t('stats.listings') },
    { value: "500+", label: t('stats.employers') },
    { value: "85%", label: t('stats.successRate') },
    { value: "3,200+", label: t('stats.placements') }
  ];

  // Job Matching Tab Content
  const JobMatchingTabContent = () => (
    <div className="space-y-8">
      {/* Coming Soon Section */}
      <div className="text-center py-12">
        <Search className="h-20 w-20 mx-auto text-primary mb-6" />
        <h3 className="text-2xl font-bold mb-4">{t('matching.title')}</h3>
        <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
          {t('matching.description')}
        </p>
        <Button size="lg" className="mb-8">
          <Bell className="h-4 w-4 mr-2" />
          {t('matching.notifyMe')}
        </Button>
      </div>

      {/* Features Preview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-12 w-12 mx-auto text-primary mb-4" />
            <h4 className="font-semibold mb-2">{t('matching.features.aiMatching')}</h4>
            <p className="text-sm text-muted-foreground">Smart AI-powered job matching</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-primary mb-4" />
            <h4 className="font-semibold mb-2">{t('matching.features.skillAnalysis')}</h4>
            <p className="text-sm text-muted-foreground">Comprehensive skill analysis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-primary mb-4" />
            <h4 className="font-semibold mb-2">{t('matching.features.careerPath')}</h4>
            <p className="text-sm text-muted-foreground">Personalized career paths</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <RefreshCw className="h-12 w-12 mx-auto text-primary mb-4" />
            <h4 className="font-semibold mb-2">{t('matching.features.realTime')}</h4>
            <p className="text-sm text-muted-foreground">Real-time job updates</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Preview */}
      <Card>
        <CardHeader>
          <CardTitle>{t('matching.stats.totalMatches')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">47</div>
              <div className="text-sm text-muted-foreground">{t('matching.stats.totalMatches')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">12</div>
              <div className="text-sm text-muted-foreground">{t('matching.stats.newThisWeek')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">85%</div>
              <div className="text-sm text-muted-foreground">{t('matching.stats.profileCompleteness')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">92%</div>
              <div className="text-sm text-muted-foreground">{t('matching.stats.matchAccuracy')}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Job Search Tab Content
  const JobSearchTabContent = () => (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-4">{t('search.title')}</h3>
        <p className="text-muted-foreground">{t('search.description')}</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder={t('search.placeholder')}
            className="h-12"
          />
        </div>
        <Button size="lg">
          <Search className="h-4 w-4 mr-2" />
          {t('actions.search')}
        </Button>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-4 gap-4">
        <Select>
          <SelectTrigger>
            <SelectValue placeholder={t('search.filters.location')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dubai">{t('locations.dubai')}</SelectItem>
            <SelectItem value="abudhabi">{t('locations.abuDhabi')}</SelectItem>
            <SelectItem value="sharjah">{t('locations.sharjah')}</SelectItem>
            <SelectItem value="remote">{t('locations.remote')}</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger>
            <SelectValue placeholder={t('search.filters.industry')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="technology">{t('industries.technology')}</SelectItem>
            <SelectItem value="banking">{t('industries.banking')}</SelectItem>
            <SelectItem value="healthcare">{t('industries.healthcare')}</SelectItem>
            <SelectItem value="government">{t('industries.government')}</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger>
            <SelectValue placeholder={t('search.filters.jobType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fulltime">{t('search.jobTypes.fullTime')}</SelectItem>
            <SelectItem value="parttime">{t('search.jobTypes.partTime')}</SelectItem>
            <SelectItem value="contract">{t('search.jobTypes.contract')}</SelectItem>
            <SelectItem value="remote">{t('search.jobTypes.remote')}</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger>
            <SelectValue placeholder={t('search.filters.experience')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="entry">{t('search.experienceLevels.entry')}</SelectItem>
            <SelectItem value="junior">{t('search.experienceLevels.junior')}</SelectItem>
            <SelectItem value="mid">{t('search.experienceLevels.mid')}</SelectItem>
            <SelectItem value="senior">{t('search.experienceLevels.senior')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sample Job Cards */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-semibold">Featured Jobs</h4>
          <Badge variant="secondary">1,247 {t('search.results.found')}</Badge>
        </div>

        {/* Job Card 1 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-semibold">Senior Product Manager</h4>
                  <Badge className="bg-green-100 text-green-800">95% {t('jobCard.match')}</Badge>
                  <Badge variant="secondary">{t('jobCard.status.featured')}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    Emirates Group
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {t('locations.dubai')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4" />
                    AED 18,000 - 25,000
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    2 days ago
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Lead product development for next-generation aviation services...
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Product Strategy</Badge>
                  <Badge variant="outline">Agile</Badge>
                  <Badge variant="outline">Leadership</Badge>
                  <Badge variant="outline">Analytics</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button>
                <Send className="h-4 w-4 mr-2" />
                {t('jobCard.actions.apply')}
              </Button>
              <Button variant="outline">
                <Heart className="h-4 w-4 mr-2" />
                {t('jobCard.actions.save')}
              </Button>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                {t('jobCard.actions.viewDetails')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Job Card 2 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-semibold">Digital Marketing Director</h4>
                  <Badge className="bg-blue-100 text-blue-800">88% {t('jobCard.match')}</Badge>
                  <Badge variant="secondary">{t('jobCard.status.new')}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    Dubai Tourism
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {t('locations.dubai')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4" />
                    AED 15,000 - 22,000
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    1 day ago
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Drive digital marketing strategy for Dubai's tourism sector...
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Digital Marketing</Badge>
                  <Badge variant="outline">Strategy</Badge>
                  <Badge variant="outline">Tourism</Badge>
                  <Badge variant="outline">Leadership</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button>
                <Send className="h-4 w-4 mr-2" />
                {t('jobCard.actions.apply')}
              </Button>
              <Button variant="outline">
                <Heart className="h-4 w-4 mr-2" />
                {t('jobCard.actions.save')}
              </Button>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                {t('jobCard.actions.viewDetails')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Saved Jobs Tab Content
  const SavedJobsTabContent = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <BookmarkPlus className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('saved.empty.title')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('saved.empty.description')}
        </p>
        <Button>
          <Search className="h-4 w-4 mr-2" />
          {t('saved.empty.action')}
        </Button>
      </div>
    </div>
  );

  // Applications Tab Content
  const ApplicationsTabContent = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Send className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('applications.empty.title')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('applications.empty.description')}
        </p>
        <Button>
          <Search className="h-4 w-4 mr-2" />
          {t('applications.empty.action')}
        </Button>
      </div>
    </div>
  );

  // Recommendations Tab Content
  const RecommendationsTabContent = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('recommendations.empty.title')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('recommendations.empty.description')}
        </p>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          {t('recommendations.empty.action')}
        </Button>
      </div>
    </div>
  );

  const tabs = [
    {
      id: "matching",
      label: t('tabs.matching.label'),
      icon: <Search className="h-4 w-4" />,
      content: <JobMatchingTabContent />
    },
    {
      id: "search",
      label: t('tabs.search.label'),
      icon: <Filter className="h-4 w-4" />,
      content: <JobSearchTabContent />
    },
    {
      id: "saved",
      label: t('tabs.saved.label'),
      icon: <Heart className="h-4 w-4" />,
      content: <SavedJobsTabContent />
    },
    {
      id: "applications",
      label: t('tabs.applications.label'),
      icon: <Send className="h-4 w-4" />,
      content: <ApplicationsTabContent />
    },
    {
      id: "recommendations",
      label: t('tabs.recommendations.label'),
      icon: <Star className="h-4 w-4" />,
      content: <RecommendationsTabContent />
    }
  ];

  return (
    <CareerPageLayout
      title={t('title')}
      description={t('description')}
      heroIcon={<Search className="h-12 w-12" />}
      primaryActionLabel={t('primaryAction')}
      primaryActionIcon={<Target className="h-4 w-4" />}
      secondaryActionLabel={t('secondaryAction')}
      stats={stats}
      quote={t('quote')}
      attribution={t('attribution')}
      quoteIcon={<Target className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="matching"
    />
  );
};

export default JobMatchingPage;

