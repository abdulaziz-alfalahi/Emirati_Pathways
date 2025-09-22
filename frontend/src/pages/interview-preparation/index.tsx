import React from 'react';
import { useTranslation } from 'react-i18next';
import { CareerPageLayout } from '@/components/career/CareerPageLayout';
import { MessageCircle, Users, Target, Award, Mail, Play, BookOpen, Lightbulb, BarChart3, Video, Mic, Star, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const InterviewPreparationPage: React.FC = () => {
  const { t } = useTranslation('interview-preparation');

  const stats = [
    { value: "500+", label: t('stats.questions') },
    { value: "20+", label: t('stats.types') },
    { value: "1,000+", label: t('stats.mockInterviews') },
    { value: "85%", label: t('stats.successRate') }
  ];

  // Get tips data to avoid i18n array issues
  const getTipsData = () => {
    return [
      {
        title: t('tips.general.0.title', 'Research the company beforehand'),
        description: t('tips.general.0.description', 'Learn about the company\'s history, values, and recent projects before the interview')
      },
      {
        title: t('tips.general.1.title', 'Practice common questions'),
        description: t('tips.general.1.description', 'Prepare answers for common questions like \'Tell me about yourself\' and \'What are your strengths and weaknesses\'')
      },
      {
        title: t('tips.general.2.title', 'Dress professionally'),
        description: t('tips.general.2.description', 'Wear appropriate attire for the interview and maintain good personal hygiene')
      },
      {
        title: t('tips.general.3.title', 'Ask thoughtful questions'),
        description: t('tips.general.3.description', 'Prepare thoughtful questions about the role and company to show genuine interest')
      },
      {
        title: t('tips.general.4.title', 'Follow up after the interview'),
        description: t('tips.general.4.description', 'Send a thank you message within 24 hours of the interview')
      },
      {
        title: t('tips.general.5.title', 'Be authentic and positive'),
        description: t('tips.general.5.description', 'Show your true personality and maintain a positive attitude throughout the interview')
      }
    ];
  };

  const getUAETipsData = () => {
    return [
      {
        title: t('tips.uae.0.title', 'Understand UAE culture'),
        description: t('tips.uae.0.description', 'Learn about Emirati values and traditions and show respect for them')
      },
      {
        title: t('tips.uae.1.title', 'Show commitment to development'),
        description: t('tips.uae.1.description', 'Emphasize your desire to contribute to D33 and Talent33')
      },
      {
        title: t('tips.uae.2.title', 'Discuss diversity'),
        description: t('tips.uae.2.description', 'Demonstrate your ability to work in a multicultural environment')
      }
    ];
  };

  // Preparation Tab Content
  const PreparationTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.preparation.description')}
        </p>
      </div>

      <div className="text-center py-12">
        <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('preparation.title')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('preparation.description')}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <Play className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('preparation.features.practice')}</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <MessageCircle className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('preparation.features.feedback')}</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <BarChart3 className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('preparation.features.analysis')}</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <TrendingUp className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('preparation.features.improvement')}</p>
          </div>
        </div>

        <Badge variant="secondary" className="mb-4">
          {t('preparation.comingSoon')}
        </Badge>
        <br />
        <Button variant="outline">
          <Mail className="h-4 w-4 mr-2" />
          {t('preparation.notifyMe')}
        </Button>
      </div>
    </div>
  );

  // Simulator Tab Content
  const SimulatorTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.simulator.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="h-5 w-5 mr-2" />
              {t('simulator.setup.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('simulator.setup.industry')}</label>
              <div className="grid grid-cols-2 gap-2">
                {['banking', 'technology', 'healthcare', 'government'].map((industry) => (
                  <Badge key={industry} variant="outline" className="justify-center">
                    {t(`industries.${industry}`)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('simulator.setup.duration')}</label>
              <div className="flex gap-2">
                <Badge variant="outline">15 min</Badge>
                <Badge variant="outline">30 min</Badge>
                <Badge variant="outline">45 min</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              {t('sessions.statistics.totalSessions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('sessions.statistics.totalSessions')}</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('sessions.statistics.averageScore')}</span>
                <span className="font-semibold">--</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('sessions.statistics.improvement')}</span>
                <span className="font-semibold">--</span>
              </div>
              <Progress value={0} className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button size="lg">
          <Play className="h-4 w-4 mr-2" />
          {t('actions.start')} {t('tabs.simulator.label')}
        </Button>
      </div>
    </div>
  );

  // Questions Tab Content
  const QuestionsTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.questions.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['behavioral', 'technical', 'situational', 'cultural', 'leadership', 'problemSolving'].map((category) => (
          <Card key={category} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="bg-primary/10 rounded-lg p-4 mb-4">
                <BookOpen className="h-8 w-8 mx-auto text-primary" />
              </div>
              <CardTitle className="text-center">
                {t(`questions.categories.${category}`)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <Badge variant="outline">{t('questions.levels.entry')}</Badge>
                <Badge variant="outline">{t('questions.levels.mid')}</Badge>
                <Badge variant="outline">{t('questions.levels.senior')}</Badge>
              </div>
              <Button className="w-full" variant="outline">
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
            <CardTitle>{t('questions.types.common')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Tell me about yourself</span>
                <Badge variant="secondary">Basic</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Why do you want this job?</span>
                <Badge variant="secondary">Common</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">What are your strengths?</span>
                <Badge variant="secondary">Basic</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('questions.types.uae')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">How do you adapt to UAE culture?</span>
                <Badge variant="secondary">Cultural</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Contribution to D33 and Talent33?</span>
                <Badge variant="secondary">Strategic</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Working in diverse teams?</span>
                <Badge variant="secondary">Behavioral</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Tips Tab Content
  const TipsTabContent = () => {
    const generalTips = getTipsData();
    const uaeTips = getUAETipsData();
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('tabs.tips.description')}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">{t('tips.categories.preparation')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generalTips.map((tip, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 rounded-lg p-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{tip.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">UAE Specific Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {uaeTips.map((tip, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 rounded-lg p-2">
                      <Star className="h-5 w-5 text-green-600" />
                    </div>
                    <CardTitle className="text-base">{tip.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['preparation', 'presentation', 'communication', 'followUp'].map((category) => (
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

  // Feedback Tab Content
  const FeedbackTabContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('tabs.feedback.description')}
        </p>
      </div>

      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('emptyState.title')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('emptyState.description')}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
          {['overall', 'communication', 'confidence', 'clarity', 'relevance', 'professionalism'].map((metric) => (
            <Card key={metric} className="text-center">
              <CardHeader>
                <CardTitle className="text-sm">
                  {t(`feedback.metrics.${metric}`)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <Progress value={0} className="w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Button>
          <Play className="h-4 w-4 mr-2" />
          {t('emptyState.action')}
        </Button>
      </div>
    </div>
  );

  const tabs = [
    {
      id: 'preparation',
      label: t('tabs.preparation.label'),
      icon: <MessageCircle className="h-4 w-4" />,
      content: <PreparationTabContent />
    },
    {
      id: 'simulator',
      label: t('tabs.simulator.label'),
      icon: <Video className="h-4 w-4" />,
      content: <SimulatorTabContent />
    },
    {
      id: 'questions',
      label: t('tabs.questions.label'),
      icon: <BookOpen className="h-4 w-4" />,
      content: <QuestionsTabContent />
    },
    {
      id: 'tips',
      label: t('tabs.tips.label'),
      icon: <Lightbulb className="h-4 w-4" />,
      content: <TipsTabContent />
    },
    {
      id: 'feedback',
      label: t('tabs.feedback.label'),
      icon: <BarChart3 className="h-4 w-4" />,
      content: <FeedbackTabContent />
    }
  ];

  return (
    <CareerPageLayout
      title={t('title')}
      description={t('description')}
      heroIcon={<MessageCircle className="h-12 w-12" />}
      primaryActionLabel={t('primaryAction')}
      primaryActionIcon={<MessageCircle className="h-4 w-4" />}
      secondaryActionLabel={t('secondaryAction')}
      stats={stats}
      quote={t('quote')}
      attribution={t('attribution')}
      quoteIcon={<Target className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="preparation"
    />
  );
};

export default InterviewPreparationPage;

