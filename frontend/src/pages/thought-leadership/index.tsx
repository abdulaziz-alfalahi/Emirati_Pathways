import React from 'react';
import { useLifelongEngagementTranslation } from '@/hooks/useLifelongEngagementTranslation';
import { LifelongEngagementLayout } from '@/components/lifelong-engagement/LifelongEngagementLayout';
import { Lightbulb, BookOpen, Users, TrendingUp, Award, Star, Calendar, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ThoughtLeadershipPage: React.FC = () => {
  const { t } = useLifelongEngagementTranslation('thought-leadership');

  const stats = [
    {
      label: t('stats.articlesLabel', 'Published Articles'),
      value: t('stats.articles', '1,200+'),
      icon: BookOpen,
      color: 'text-blue-600'
    },
    {
      label: t('stats.expertsLabel', 'Expert Contributors'),
      value: t('stats.experts', '350+'),
      icon: Users,
      color: 'text-green-600'
    },
    {
      label: t('stats.readersLabel', 'Monthly Readers'),
      value: t('stats.readers', '75K+'),
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      label: t('stats.impactLabel', 'Policy Impact'),
      value: t('stats.impact', '92%'),
      icon: Award,
      color: 'text-orange-600'
    }
  ];

  const tabs = [
    {
      id: 'articles',
      label: t('tabs.articles.label', 'Articles & Insights'),
      icon: <BookOpen className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  {t('tabs.articles.content.innovation.title', 'Innovation & Technology')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.articles.content.innovation.description', 'Cutting-edge insights on technological advancement and digital transformation')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.articles.content.innovation.featured.ai.title', 'AI in Government Services')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.articles.content.innovation.featured.ai.description', 'How artificial intelligence is revolutionizing public service delivery')}</div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.articles.content.innovation.featured.ai.category', 'Technology')}</Badge>
                      <span className="text-xs text-gray-500">{t('tabs.articles.content.innovation.featured.ai.date', '2 days ago')}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.articles.content.innovation.featured.blockchain.title', 'Blockchain for Transparency')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.articles.content.innovation.featured.blockchain.description', 'Implementing blockchain technology for government transparency')}</div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.articles.content.innovation.featured.blockchain.category', 'Innovation')}</Badge>
                      <span className="text-xs text-gray-500">{t('tabs.articles.content.innovation.featured.blockchain.date', '1 week ago')}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.articles.content.innovation.featured.smart.title', 'Smart City Development')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.articles.content.innovation.featured.smart.description', 'Building sustainable and intelligent urban environments')}</div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.articles.content.innovation.featured.smart.category', 'Urban Planning')}</Badge>
                      <span className="text-xs text-gray-500">{t('tabs.articles.content.innovation.featured.smart.date', '2 weeks ago')}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  {t('tabs.articles.content.innovation.action', 'Read More Articles')}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  {t('tabs.articles.content.policy.title', 'Policy & Governance')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.articles.content.policy.description', 'Strategic insights on public policy development and governance frameworks')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.articles.content.policy.featured.vision.title', 'D33 and Talent33 Progress')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.articles.content.policy.featured.vision.description', 'Analyzing progress toward becoming the world\'s best country by D33')}</div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.articles.content.policy.featured.vision.category', 'Strategic Planning')}</Badge>
                      <span className="text-xs text-gray-500">{t('tabs.articles.content.policy.featured.vision.date', '3 days ago')}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.articles.content.policy.featured.sustainability.title', 'Sustainable Development Goals')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.articles.content.policy.featured.sustainability.description', 'UAE\'s approach to achieving UN Sustainable Development Goals')}</div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.articles.content.policy.featured.sustainability.category', 'Sustainability')}</Badge>
                      <span className="text-xs text-gray-500">{t('tabs.articles.content.policy.featured.sustainability.date', '5 days ago')}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.articles.content.policy.featured.digital.title', 'Digital Government Strategy')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.articles.content.policy.featured.digital.description', 'Transforming government services through digital innovation')}</div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.articles.content.policy.featured.digital.category', 'Digital Transformation')}</Badge>
                      <span className="text-xs text-gray-500">{t('tabs.articles.content.policy.featured.digital.date', '1 week ago')}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  {t('tabs.articles.content.policy.action', 'Explore Policy Papers')}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  {t('tabs.articles.content.economic.title', 'Economic Development')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.articles.content.economic.description', 'Analysis of economic trends, diversification strategies, and growth opportunities')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.articles.content.economic.featured.diversification.title', 'Economic Diversification')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.articles.content.economic.featured.diversification.description', 'Moving beyond oil: UAE\'s journey toward a knowledge economy')}</div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.articles.content.economic.featured.diversification.category', 'Economics')}</Badge>
                      <span className="text-xs text-gray-500">{t('tabs.articles.content.economic.featured.diversification.date', '4 days ago')}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.articles.content.economic.featured.entrepreneurship.title', 'Startup Ecosystem Growth')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.articles.content.economic.featured.entrepreneurship.description', 'How UAE is becoming a global hub for innovation and entrepreneurship')}</div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.articles.content.economic.featured.entrepreneurship.category', 'Entrepreneurship')}</Badge>
                      <span className="text-xs text-gray-500">{t('tabs.articles.content.economic.featured.entrepreneurship.date', '6 days ago')}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.articles.content.economic.featured.trade.title', 'Global Trade Partnerships')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.articles.content.economic.featured.trade.description', 'Strengthening international trade relationships and agreements')}</div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.articles.content.economic.featured.trade.category', 'International Trade')}</Badge>
                      <span className="text-xs text-gray-500">{t('tabs.articles.content.economic.featured.trade.date', '1 week ago')}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  {t('tabs.articles.content.economic.action', 'View Economic Reports')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.articles.content.featured.title', 'Featured Thought Leadership Series')}</CardTitle>
              <CardDescription>
                {t('tabs.articles.content.featured.description', 'In-depth analysis and forward-thinking perspectives on critical national issues')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">{t('tabs.articles.content.featured.series.title', 'Current Series: Future of Work')}</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.articles.content.featured.series.topics.remote', 'Remote Work and Digital Collaboration')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.articles.content.featured.series.topics.skills', 'Skills for the Digital Economy')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.articles.content.featured.series.topics.automation', 'Automation and Job Creation')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.articles.content.featured.series.topics.workplace', 'Workplace Culture Evolution')}
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">{t('tabs.articles.content.featured.upcoming.title', 'Upcoming Topics')}</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {t('tabs.articles.content.featured.upcoming.topics.climate', 'Climate Change Adaptation')}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {t('tabs.articles.content.featured.upcoming.topics.space', 'Space Economy Development')}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {t('tabs.articles.content.featured.upcoming.topics.health', 'Healthcare Innovation')}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {t('tabs.articles.content.featured.upcoming.topics.education', 'Education Transformation')}
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <Button>
                  {t('tabs.articles.content.featured.actions.subscribe', 'Subscribe to Series')}
                </Button>
                <Button variant="outline">
                  {t('tabs.articles.content.featured.actions.archive', 'View Archive')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'experts',
      label: t('tabs.experts.label', 'Expert Profiles'),
      icon: <Users className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                {t('tabs.experts.content.overview.title', 'Thought Leaders & Experts')}
              </CardTitle>
              <CardDescription>
                {t('tabs.experts.content.overview.description', 'Meet the visionary leaders shaping UAE\'s future through innovative thinking and strategic insights')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lightbulb className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.experts.content.overview.categories.innovation.title', 'Innovation Leaders')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.experts.content.overview.categories.innovation.description', 'Pioneers in technology and digital transformation')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.experts.content.overview.categories.policy.title', 'Policy Experts')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.experts.content.overview.categories.policy.description', 'Strategic thinkers in governance and public policy')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.experts.content.overview.categories.economic.title', 'Economic Strategists')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.experts.content.overview.categories.economic.description', 'Visionaries in economic development and growth')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.experts.content.featured.title', 'Featured Experts')}</CardTitle>
                <CardDescription>
                  {t('tabs.experts.content.featured.description', 'Leading voices in their respective fields')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {t('tabs.experts.content.featured.profiles.omar.initials', 'OA')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{t('tabs.experts.content.featured.profiles.omar.name', 'Dr. Omar Al-Nuaimi')}</h4>
                      <p className="text-xs text-gray-600">{t('tabs.experts.content.featured.profiles.omar.title', 'Director of Digital Innovation')}</p>
                      <p className="text-xs text-gray-500 mt-1">{t('tabs.experts.content.featured.profiles.omar.expertise', 'Expertise: AI, Blockchain, Smart Cities')}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{t('tabs.experts.content.featured.profiles.omar.articles', '45 Articles')}</Badge>
                        <Badge variant="outline" className="text-xs">{t('tabs.experts.content.featured.profiles.omar.impact', 'High Impact')}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                      {t('tabs.experts.content.featured.profiles.fatima.initials', 'FS')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{t('tabs.experts.content.featured.profiles.fatima.name', 'Dr. Fatima Al-Shamsi')}</h4>
                      <p className="text-xs text-gray-600">{t('tabs.experts.content.featured.profiles.fatima.title', 'Senior Policy Advisor')}</p>
                      <p className="text-xs text-gray-500 mt-1">{t('tabs.experts.content.featured.profiles.fatima.expertise', 'Expertise: Public Policy, Governance, Strategic Planning')}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{t('tabs.experts.content.featured.profiles.fatima.articles', '38 Articles')}</Badge>
                        <Badge variant="outline" className="text-xs">{t('tabs.experts.content.featured.profiles.fatima.impact', 'Policy Influence')}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {t('tabs.experts.content.featured.profiles.ahmed.initials', 'AK')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{t('tabs.experts.content.featured.profiles.ahmed.name', 'Ahmed Al-Kaabi')}</h4>
                      <p className="text-xs text-gray-600">{t('tabs.experts.content.featured.profiles.ahmed.title', 'Economic Development Specialist')}</p>
                      <p className="text-xs text-gray-500 mt-1">{t('tabs.experts.content.featured.profiles.ahmed.expertise', 'Expertise: Economic Diversification, Trade, Investment')}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{t('tabs.experts.content.featured.profiles.ahmed.articles', '52 Articles')}</Badge>
                        <Badge variant="outline" className="text-xs">{t('tabs.experts.content.featured.profiles.ahmed.impact', 'Economic Impact')}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="w-full mt-4">
                  {t('tabs.experts.content.featured.action', 'View All Experts')}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.experts.content.contributions.title', 'Expert Contributions')}</CardTitle>
                <CardDescription>
                  {t('tabs.experts.content.contributions.description', 'Recent insights and thought leadership pieces')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold text-sm">{t('tabs.experts.content.contributions.recent.ai.title', 'The Future of AI Governance')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.experts.content.contributions.recent.ai.description', 'Dr. Omar Al-Nuaimi explores ethical frameworks for AI implementation in government services')}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.experts.content.contributions.recent.ai.category', 'Technology Policy')}</Badge>
                      <span className="text-xs text-gray-500">{t('tabs.experts.content.contributions.recent.ai.date', 'Yesterday')}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold text-sm">{t('tabs.experts.content.contributions.recent.sustainability.title', 'Sustainable Development Roadmap')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.experts.content.contributions.recent.sustainability.description', 'Dr. Fatima Al-Shamsi outlines policy priorities for achieving carbon neutrality by 2050')}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.experts.content.contributions.recent.sustainability.category', 'Environmental Policy')}</Badge>
                      <span className="text-xs text-gray-500">{t('tabs.experts.content.contributions.recent.sustainability.date', '2 days ago')}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold text-sm">{t('tabs.experts.content.contributions.recent.economy.title', 'Post-Oil Economic Strategy')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.experts.content.contributions.recent.economy.description', 'Ahmed Al-Kaabi analyzes pathways to a knowledge-based economy and innovation ecosystem')}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.experts.content.contributions.recent.economy.category', 'Economic Strategy')}</Badge>
                      <span className="text-xs text-gray-500">{t('tabs.experts.content.contributions.recent.economy.date', '3 days ago')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.experts.content.network.title', 'Expert Network & Collaboration')}</CardTitle>
              <CardDescription>
                {t('tabs.experts.content.network.description', 'Building connections and fostering collaborative thought leadership')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.experts.content.network.steps.apply.title', 'Apply to Join')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.experts.content.network.steps.apply.description', 'Submit your expertise profile and thought leadership portfolio')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.experts.content.network.steps.review.title', 'Peer Review')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.experts.content.network.steps.review.description', 'Undergo evaluation by existing network members and advisory board')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.experts.content.network.steps.contribute.title', 'Start Contributing')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.experts.content.network.steps.contribute.description', 'Begin publishing insights and participating in collaborative projects')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">4</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.experts.content.network.steps.influence.title', 'Drive Impact')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.experts.content.network.steps.influence.description', 'Shape policy discussions and influence strategic decision-making')}</p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Button size="lg">
                  {t('tabs.experts.content.network.action', 'Join Expert Network')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'insights',
      label: t('tabs.insights.label', 'Strategic Insights'),
      icon: <TrendingUp className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  {t('tabs.insights.content.trends.title', 'Emerging Trends')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.insights.content.trends.description', 'Identifying and analyzing key trends shaping the future')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.insights.content.trends.items.quantum.title', 'Quantum Computing Revolution')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.insights.content.trends.items.quantum.description', 'Preparing for the quantum leap in computational capabilities')}</div>
                    <Badge variant="outline" className="text-xs">{t('tabs.insights.content.trends.items.quantum.impact', 'High Impact')}</Badge>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.insights.content.trends.items.metaverse.title', 'Metaverse Governance')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.insights.content.trends.items.metaverse.description', 'Regulatory frameworks for virtual world interactions')}</div>
                    <Badge variant="outline" className="text-xs">{t('tabs.insights.content.trends.items.metaverse.impact', 'Emerging')}</Badge>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.insights.content.trends.items.biotech.title', 'Biotechnology Ethics')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.insights.content.trends.items.biotech.description', 'Ethical considerations in genetic engineering and biotech')}</div>
                    <Badge variant="outline" className="text-xs">{t('tabs.insights.content.trends.items.biotech.impact', 'Critical')}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  {t('tabs.insights.content.trends.action', 'Explore Trends')}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  {t('tabs.insights.content.forecasts.title', 'Strategic Forecasts')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.insights.content.forecasts.description', 'Data-driven predictions and scenario planning')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.insights.content.forecasts.items.energy.title', 'Energy Transition Timeline')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.insights.content.forecasts.items.energy.description', 'Projected milestones for renewable energy adoption')}</div>
                    <Badge variant="outline" className="text-xs">{t('tabs.insights.content.forecasts.items.energy.timeline', '2025-2050')}</Badge>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.insights.content.forecasts.items.demographics.title', 'Demographic Shifts')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.insights.content.forecasts.items.demographics.description', 'Population trends and their policy implications')}</div>
                    <Badge variant="outline" className="text-xs">{t('tabs.insights.content.forecasts.items.demographics.timeline', '2030-D33')}</Badge>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.insights.content.forecasts.items.skills.title', 'Future Skills Demand')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.insights.content.forecasts.items.skills.description', 'Evolving workforce requirements and education needs')}</div>
                    <Badge variant="outline" className="text-xs">{t('tabs.insights.content.forecasts.items.skills.timeline', '2025-2035')}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  {t('tabs.insights.content.forecasts.action', 'View Forecasts')}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  {t('tabs.insights.content.recommendations.title', 'Policy Recommendations')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.insights.content.recommendations.description', 'Evidence-based policy suggestions and frameworks')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.insights.content.recommendations.items.digital.title', 'Digital Rights Framework')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.insights.content.recommendations.items.digital.description', 'Protecting citizen privacy in the digital age')}</div>
                    <Badge variant="outline" className="text-xs">{t('tabs.insights.content.recommendations.items.digital.priority', 'High Priority')}</Badge>
                  </div>
                  
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.insights.content.recommendations.items.climate.title', 'Climate Adaptation Strategy')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.insights.content.recommendations.items.climate.description', 'Building resilience against climate change impacts')}</div>
                    <Badge variant="outline" className="text-xs">{t('tabs.insights.content.recommendations.items.climate.priority', 'Urgent')}</Badge>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{t('tabs.insights.content.recommendations.items.innovation.title', 'Innovation Ecosystem Policy')}</div>
                    <div className="text-xs text-gray-600 mb-2">{t('tabs.insights.content.recommendations.items.innovation.description', 'Fostering entrepreneurship and R&D investment')}</div>
                    <Badge variant="outline" className="text-xs">{t('tabs.insights.content.recommendations.items.innovation.priority', 'Strategic')}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  {t('tabs.insights.content.recommendations.action', 'Read Recommendations')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.insights.content.research.title', 'Strategic Research Initiatives')}</CardTitle>
              <CardDescription>
                {t('tabs.insights.content.research.description', 'Ongoing research projects informing national strategy and policy development')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">{t('tabs.insights.content.research.current.title', 'Current Research Projects')}</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-semibold text-sm mb-1">{t('tabs.insights.content.research.current.projects.ai.title', 'AI Ethics in Government')}</div>
                      <div className="text-xs text-gray-600 mb-2">{t('tabs.insights.content.research.current.projects.ai.description', 'Developing ethical guidelines for AI use in public services')}</div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{t('tabs.insights.content.research.current.projects.ai.status', '60% Complete')}</Badge>
                        <span className="text-xs text-gray-500">{t('tabs.insights.content.research.current.projects.ai.timeline', 'Q2 2024')}</span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-semibold text-sm mb-1">{t('tabs.insights.content.research.current.projects.sustainability.title', 'Circular Economy Model')}</div>
                      <div className="text-xs text-gray-600 mb-2">{t('tabs.insights.content.research.current.projects.sustainability.description', 'Designing sustainable resource management frameworks')}</div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{t('tabs.insights.content.research.current.projects.sustainability.status', '40% Complete')}</Badge>
                        <span className="text-xs text-gray-500">{t('tabs.insights.content.research.current.projects.sustainability.timeline', 'Q3 2024')}</span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="font-semibold text-sm mb-1">{t('tabs.insights.content.research.current.projects.space.title', 'Space Economy Strategy')}</div>
                      <div className="text-xs text-gray-600 mb-2">{t('tabs.insights.content.research.current.projects.space.description', 'Mapping opportunities in the emerging space economy')}</div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{t('tabs.insights.content.research.current.projects.space.status', '25% Complete')}</Badge>
                        <span className="text-xs text-gray-500">{t('tabs.insights.content.research.current.projects.space.timeline', 'Q4 2024')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">{t('tabs.insights.content.research.impact.title', 'Research Impact Metrics')}</h4>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600 mb-1">150+</div>
                      <div className="text-sm text-gray-600">{t('tabs.insights.content.research.impact.metrics.publications', 'Research Publications')}</div>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">25</div>
                      <div className="text-sm text-gray-600">{t('tabs.insights.content.research.impact.metrics.policies', 'Policies Influenced')}</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-1">85%</div>
                      <div className="text-sm text-gray-600">{t('tabs.insights.content.research.impact.metrics.implementation', 'Implementation Rate')}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <Button>
                  {t('tabs.insights.content.research.actions.collaborate', 'Collaborate on Research')}
                </Button>
                <Button variant="outline">
                  {t('tabs.insights.content.research.actions.propose', 'Propose Research Topic')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'trends',
      label: t('tabs.trends.label', 'Future Trends'),
      icon: <Lightbulb className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                {t('tabs.trends.content.overview.title', 'Future Trends Analysis')}
              </CardTitle>
              <CardDescription>
                {t('tabs.trends.content.overview.description', 'Identifying and preparing for transformative trends that will shape the UAE\'s future')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lightbulb className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.trends.content.overview.categories.technology.title', 'Technology Trends')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.trends.content.overview.categories.technology.description', 'Emerging technologies and digital transformation')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.trends.content.overview.categories.social.title', 'Social Trends')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.trends.content.overview.categories.social.description', 'Societal changes and demographic shifts')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.trends.content.overview.categories.economic.title', 'Economic Trends')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.trends.content.overview.categories.economic.description', 'Economic patterns and market evolution')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.trends.content.emerging.title', 'Emerging Trends to Watch')}</CardTitle>
                <CardDescription>
                  {t('tabs.trends.content.emerging.description', 'Key trends with significant potential impact on UAE\'s development')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold text-sm">{t('tabs.trends.content.emerging.trends.quantum.title', 'Quantum Computing Adoption')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.trends.content.emerging.trends.quantum.description', 'Revolutionary computing power transforming cryptography, optimization, and scientific research')}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.trends.content.emerging.trends.quantum.timeline', '2025-2030')}</Badge>
                      <Badge variant="outline" className="text-xs">{t('tabs.trends.content.emerging.trends.quantum.impact', 'Transformative')}</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold text-sm">{t('tabs.trends.content.emerging.trends.longevity.title', 'Longevity Economy')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.trends.content.emerging.trends.longevity.description', 'Aging population creating new markets and requiring healthcare system adaptations')}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.trends.content.emerging.trends.longevity.timeline', '2024-2040')}</Badge>
                      <Badge variant="outline" className="text-xs">{t('tabs.trends.content.emerging.trends.longevity.impact', 'High Impact')}</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-semibold text-sm">{t('tabs.trends.content.emerging.trends.circular.title', 'Circular Economy Maturation')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.trends.content.emerging.trends.circular.description', 'Waste-to-resource systems becoming mainstream, driving sustainable business models')}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.trends.content.emerging.trends.circular.timeline', '2024-2035')}</Badge>
                      <Badge variant="outline" className="text-xs">{t('tabs.trends.content.emerging.trends.circular.impact', 'Sustainable')}</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-purple-500" />
                      <span className="font-semibold text-sm">{t('tabs.trends.content.emerging.trends.space.title', 'Commercial Space Economy')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.trends.content.emerging.trends.space.description', 'Private space industry creating new opportunities in satellite services, space tourism, and manufacturing')}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.trends.content.emerging.trends.space.timeline', '2025-2050')}</Badge>
                      <Badge variant="outline" className="text-xs">{t('tabs.trends.content.emerging.trends.space.impact', 'Exponential')}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.trends.content.implications.title', 'Strategic Implications')}</CardTitle>
                <CardDescription>
                  {t('tabs.trends.content.implications.description', 'How emerging trends will impact UAE\'s strategic priorities and policy directions')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">{t('tabs.trends.content.implications.areas.workforce.title', 'Workforce Transformation')}</h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                        {t('tabs.trends.content.implications.areas.workforce.points.reskilling', 'Massive reskilling programs needed')}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                        {t('tabs.trends.content.implications.areas.workforce.points.remote', 'Remote work becoming permanent')}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                        {t('tabs.trends.content.implications.areas.workforce.points.automation', 'Human-AI collaboration models')}
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">{t('tabs.trends.content.implications.areas.infrastructure.title', 'Infrastructure Needs')}</h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                        {t('tabs.trends.content.implications.areas.infrastructure.points.quantum', 'Quantum-safe cybersecurity')}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                        {t('tabs.trends.content.implications.areas.infrastructure.points.energy', 'Renewable energy grid expansion')}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                        {t('tabs.trends.content.implications.areas.infrastructure.points.space', 'Space infrastructure development')}
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">{t('tabs.trends.content.implications.areas.governance.title', 'Governance Evolution')}</h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                        {t('tabs.trends.content.implications.areas.governance.points.digital', 'Digital-first policy frameworks')}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                        {t('tabs.trends.content.implications.areas.governance.points.agile', 'Agile regulatory approaches')}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                        {t('tabs.trends.content.implications.areas.governance.points.ethics', 'AI ethics and oversight bodies')}
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">{t('tabs.trends.content.implications.areas.economic.title', 'Economic Opportunities')}</h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                        {t('tabs.trends.content.implications.areas.economic.points.new', 'New industry sector emergence')}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                        {t('tabs.trends.content.implications.areas.economic.points.investment', 'Strategic investment priorities')}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                        {t('tabs.trends.content.implications.areas.economic.points.partnerships', 'International partnership models')}
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.trends.content.monitoring.title', 'Trend Monitoring & Analysis')}</CardTitle>
              <CardDescription>
                {t('tabs.trends.content.monitoring.description', 'Systematic approach to tracking and analyzing emerging trends for strategic planning')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-yellow-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.trends.content.monitoring.process.identify.title', 'Trend Identification')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.trends.content.monitoring.process.identify.description', 'Systematic scanning of global developments and weak signals')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.trends.content.monitoring.process.analyze.title', 'Impact Analysis')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.trends.content.monitoring.process.analyze.description', 'Assessing potential implications for UAE\'s strategic objectives')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.trends.content.monitoring.process.scenario.title', 'Scenario Planning')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.trends.content.monitoring.process.scenario.description', 'Developing multiple future scenarios and response strategies')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">4</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.trends.content.monitoring.process.recommend.title', 'Strategic Recommendations')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.trends.content.monitoring.process.recommend.description', 'Translating insights into actionable policy and investment guidance')}</p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Button size="lg">
                  {t('tabs.trends.content.monitoring.action', 'Access Trend Reports')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ];

  return (
    <LifelongEngagementLayout
      title={t('title', 'Thought Leadership')}
      description={t('description', 'Driving innovation and strategic thinking through expert insights and forward-looking analysis')}
      icon={<Lightbulb className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="articles"
    />
  );
};

export default ThoughtLeadershipPage;

