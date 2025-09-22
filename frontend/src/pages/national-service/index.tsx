import React from 'react';
import { useLifelongEngagementTranslation } from '@/hooks/useLifelongEngagementTranslation';
import { LifelongEngagementLayout } from '@/components/lifelong-engagement/LifelongEngagementLayout';
import { Shield, Users, Heart, Leaf, Award, Target, Calendar, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const NationalServicePage: React.FC = () => {
  const { t } = useLifelongEngagementTranslation('national-service');

  const stats = [
    {
      label: t('stats.volunteersLabel', 'Active Volunteers'),
      value: t('stats.volunteers', '8,200+'),
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: t('stats.programsLabel', 'Service Programs'),
      value: t('stats.programs', '45+'),
      icon: Shield,
      color: 'text-green-600'
    },
    {
      label: t('stats.hoursLabel', 'Service Hours'),
      value: t('stats.hours', '150K+'),
      icon: Award,
      color: 'text-purple-600'
    },
    {
      label: t('stats.impactLabel', 'Community Impact'),
      value: t('stats.impact', '95%'),
      icon: Heart,
      color: 'text-red-600'
    }
  ];

  const tabs = [
    {
      id: 'programs',
      label: t('tabs.programs.label', 'Service Programs'),
      icon: <Shield className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  {t('tabs.programs.content.defense.title', 'Defense & Security')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.programs.content.defense.description', 'Supporting national defense and security initiatives')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {t('tabs.programs.content.defense.features.training', 'Military training programs')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {t('tabs.programs.content.defense.features.cybersecurity', 'Cybersecurity awareness')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {t('tabs.programs.content.defense.features.emergency', 'Emergency response training')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {t('tabs.programs.content.defense.features.border', 'Border security support')}
                  </li>
                </ul>
                <Button variant="outline" size="sm" className="w-full">
                  {t('common.joinProgram', 'Join Program')}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  {t('tabs.programs.content.community.title', 'Community Service')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.programs.content.community.description', 'Serving local communities and social development')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('tabs.programs.content.community.features.elderly', 'Elderly care programs')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('tabs.programs.content.community.features.education', 'Educational support')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('tabs.programs.content.community.features.healthcare', 'Healthcare assistance')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('tabs.programs.content.community.features.infrastructure', 'Infrastructure development')}
                  </li>
                </ul>
                <Button variant="outline" size="sm" className="w-full">
                  {t('common.volunteer', 'Volunteer Now')}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-500" />
                  {t('tabs.programs.content.environmental.title', 'Environmental Protection')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.programs.content.environmental.description', 'Protecting and preserving our natural environment')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {t('tabs.programs.content.environmental.features.conservation', 'Wildlife conservation')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {t('tabs.programs.content.environmental.features.cleanup', 'Beach and park cleanup')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {t('tabs.programs.content.environmental.features.sustainability', 'Sustainability education')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {t('tabs.programs.content.environmental.features.renewable', 'Renewable energy projects')}
                  </li>
                </ul>
                <Button variant="outline" size="sm" className="w-full">
                  {t('common.getInvolved', 'Get Involved')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.programs.content.featured.title', 'Featured Initiative: UAE National Service Corps')}</CardTitle>
              <CardDescription>
                {t('tabs.programs.content.featured.description', 'A comprehensive national service program building character and citizenship')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">{t('tabs.programs.content.featured.benefits.title', 'Program Benefits')}</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.programs.content.featured.benefits.leadership', 'Leadership development')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.programs.content.featured.benefits.skills', 'Professional skills training')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.programs.content.featured.benefits.networking', 'National networking opportunities')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.programs.content.featured.benefits.certification', 'Service completion certification')}
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">{t('tabs.programs.content.featured.commitment.title', 'Service Commitment')}</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {t('tabs.programs.content.featured.commitment.duration', '12-month service period')}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {t('tabs.programs.content.featured.commitment.training', '3-month initial training')}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {t('tabs.programs.content.featured.commitment.placement', 'Strategic placement assignment')}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {t('tabs.programs.content.featured.commitment.evaluation', 'Continuous performance evaluation')}
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <Button>
                  {t('tabs.programs.content.featured.actions.enroll', 'Enroll in Service')}
                </Button>
                <Button variant="outline">
                  {t('tabs.programs.content.featured.actions.learn', 'Learn More')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'volunteering',
      label: t('tabs.volunteering.label', 'Volunteering'),
      icon: <Users className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                {t('tabs.volunteering.content.opportunities.title', 'Volunteer Opportunities')}
              </CardTitle>
              <CardDescription>
                {t('tabs.volunteering.content.opportunities.description', 'Make a difference in your community through meaningful volunteer work')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.volunteering.content.opportunities.types.social.title', 'Social Services')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.volunteering.content.opportunities.types.social.description', 'Support vulnerable communities and social welfare programs')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Leaf className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.volunteering.content.opportunities.types.environmental.title', 'Environmental')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.volunteering.content.opportunities.types.environmental.description', 'Participate in conservation and sustainability initiatives')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-8 w-8 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.volunteering.content.opportunities.types.education.title', 'Education')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.volunteering.content.opportunities.types.education.description', 'Support educational programs and literacy initiatives')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.volunteering.content.current.title', 'Current Volunteer Drives')}</CardTitle>
                <CardDescription>
                  {t('tabs.volunteering.content.current.description', 'Join ongoing volunteer initiatives in your area')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold text-sm">{t('tabs.volunteering.content.current.drives.ramadan.title', 'Ramadan Food Distribution')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.volunteering.content.current.drives.ramadan.description', 'Help distribute iftar meals to workers and families in need during Ramadan')}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {t('tabs.volunteering.content.current.drives.ramadan.location', 'Dubai & Abu Dhabi')}
                      </Badge>
                      <Button size="sm" variant="outline">
                        {t('common.signUp', 'Sign Up')}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Leaf className="h-4 w-4 text-green-500" />
                      <span className="font-semibold text-sm">{t('tabs.volunteering.content.current.drives.cleanup.title', 'Beach Cleanup Campaign')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.volunteering.content.current.drives.cleanup.description', 'Join the monthly beach cleanup to protect marine life and coastal environments')}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {t('tabs.volunteering.content.current.drives.cleanup.location', 'All Emirates')}
                      </Badge>
                      <Button size="sm" variant="outline">
                        {t('common.participate', 'Participate')}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-purple-500" />
                      <span className="font-semibold text-sm">{t('tabs.volunteering.content.current.drives.literacy.title', 'Adult Literacy Program')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.volunteering.content.current.drives.literacy.description', 'Teach reading and writing skills to adults in underserved communities')}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {t('tabs.volunteering.content.current.drives.literacy.location', 'Northern Emirates')}
                      </Badge>
                      <Button size="sm" variant="outline">
                        {t('common.volunteer', 'Volunteer')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.volunteering.content.impact.title', 'Volunteer Impact Stories')}</CardTitle>
                <CardDescription>
                  {t('tabs.volunteering.content.impact.description', 'Real stories from our volunteer community')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold text-sm">{t('tabs.volunteering.content.impact.stories.amira.name', 'Amira Al-Zahra')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.volunteering.content.impact.stories.amira.quote', '"Volunteering at the elderly care center taught me patience and gave me a new perspective on life. The smiles I see make every hour worthwhile."')}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {t('tabs.volunteering.content.impact.stories.amira.hours', '120 Hours Volunteered')}
                    </Badge>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold text-sm">{t('tabs.volunteering.content.impact.stories.hassan.name', 'Hassan Al-Mansoori')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.volunteering.content.impact.stories.hassan.quote', '"Leading the beach cleanup team has connected me with like-minded people who care about our environment. Together, we\'ve removed over 500kg of waste."')}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {t('tabs.volunteering.content.impact.stories.hassan.impact', 'Team Leader')}
                    </Badge>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold text-sm">{t('tabs.volunteering.content.impact.stories.noura.name', 'Noura Al-Shamsi')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.volunteering.content.impact.stories.noura.quote', '"Teaching adults to read has been incredibly rewarding. Seeing their confidence grow as they learn new skills motivates me to continue volunteering."')}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {t('tabs.volunteering.content.impact.stories.noura.students', '15 Students Taught')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.volunteering.content.getStarted.title', 'How to Get Started')}</CardTitle>
              <CardDescription>
                {t('tabs.volunteering.content.getStarted.description', 'Simple steps to begin your volunteer journey')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.volunteering.content.getStarted.steps.register.title', 'Register')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.volunteering.content.getStarted.steps.register.description', 'Create your volunteer profile and specify your interests')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.volunteering.content.getStarted.steps.choose.title', 'Choose Activity')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.volunteering.content.getStarted.steps.choose.description', 'Browse and select volunteer opportunities that match your skills')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.volunteering.content.getStarted.steps.attend.title', 'Attend Training')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.volunteering.content.getStarted.steps.attend.description', 'Complete orientation and any required training sessions')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">4</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.volunteering.content.getStarted.steps.serve.title', 'Start Serving')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.volunteering.content.getStarted.steps.serve.description', 'Begin your volunteer service and make a positive impact')}</p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Button size="lg">
                  {t('tabs.volunteering.content.getStarted.action', 'Start Volunteering')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'community',
      label: t('tabs.community.label', 'Community Service'),
      icon: <Heart className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  {t('tabs.community.content.social.title', 'Social Welfare')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.community.content.social.description', 'Supporting families and individuals in need')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('tabs.community.content.social.services.food', 'Food assistance programs')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('tabs.community.content.social.services.housing', 'Housing support initiatives')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('tabs.community.content.social.services.healthcare', 'Healthcare access programs')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('tabs.community.content.social.services.counseling', 'Family counseling services')}
                  </li>
                </ul>
                <Button variant="outline" size="sm" className="w-full">
                  {t('common.support', 'Support Families')}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  {t('tabs.community.content.elderly.title', 'Elderly Care')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.community.content.elderly.description', 'Caring for our senior community members')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {t('tabs.community.content.elderly.services.visits', 'Regular home visits')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {t('tabs.community.content.elderly.services.medical', 'Medical appointment assistance')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {t('tabs.community.content.elderly.services.activities', 'Social activities and events')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {t('tabs.community.content.elderly.services.technology', 'Technology training')}
                  </li>
                </ul>
                <Button variant="outline" size="sm" className="w-full">
                  {t('common.careForElders', 'Care for Elders')}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  {t('tabs.community.content.youth.title', 'Youth Programs')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.community.content.youth.description', 'Empowering young people through community engagement')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {t('tabs.community.content.youth.programs.mentorship', 'Peer mentorship programs')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {t('tabs.community.content.youth.programs.sports', 'Community sports leagues')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {t('tabs.community.content.youth.programs.arts', 'Arts and culture workshops')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {t('tabs.community.content.youth.programs.leadership', 'Leadership development')}
                  </li>
                </ul>
                <Button variant="outline" size="sm" className="w-full">
                  {t('common.empowerYouth', 'Empower Youth')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.community.content.initiatives.title', 'Community Development Initiatives')}</CardTitle>
              <CardDescription>
                {t('tabs.community.content.initiatives.description', 'Large-scale projects improving community infrastructure and services')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">{t('tabs.community.content.initiatives.current.title', 'Current Projects')}</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-semibold text-sm mb-1">{t('tabs.community.content.initiatives.current.projects.park.title', 'Community Park Renovation')}</div>
                      <div className="text-xs text-gray-600 mb-2">{t('tabs.community.content.initiatives.current.projects.park.description', 'Upgrading playground equipment and adding accessible facilities')}</div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{t('tabs.community.content.initiatives.current.projects.park.progress', '75% Complete')}</Badge>
                        <span className="text-xs text-gray-500">{t('tabs.community.content.initiatives.current.projects.park.location', 'Al Ain')}</span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-semibold text-sm mb-1">{t('tabs.community.content.initiatives.current.projects.center.title', 'Senior Community Center')}</div>
                      <div className="text-xs text-gray-600 mb-2">{t('tabs.community.content.initiatives.current.projects.center.description', 'Building a new facility for elderly activities and healthcare')}</div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{t('tabs.community.content.initiatives.current.projects.center.progress', '40% Complete')}</Badge>
                        <span className="text-xs text-gray-500">{t('tabs.community.content.initiatives.current.projects.center.location', 'Sharjah')}</span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="font-semibold text-sm mb-1">{t('tabs.community.content.initiatives.current.projects.library.title', 'Digital Library Initiative')}</div>
                      <div className="text-xs text-gray-600 mb-2">{t('tabs.community.content.initiatives.current.projects.library.description', 'Establishing digital learning centers in underserved areas')}</div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{t('tabs.community.content.initiatives.current.projects.library.progress', '90% Complete')}</Badge>
                        <span className="text-xs text-gray-500">{t('tabs.community.content.initiatives.current.projects.library.location', 'RAK')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">{t('tabs.community.content.initiatives.impact.title', 'Community Impact')}</h4>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600 mb-1">25,000+</div>
                      <div className="text-sm text-gray-600">{t('tabs.community.content.initiatives.impact.metrics.beneficiaries', 'Community Members Served')}</div>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">150+</div>
                      <div className="text-sm text-gray-600">{t('tabs.community.content.initiatives.impact.metrics.projects', 'Projects Completed')}</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-1">AED 50M+</div>
                      <div className="text-sm text-gray-600">{t('tabs.community.content.initiatives.impact.metrics.investment', 'Community Investment')}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <Button>
                  {t('tabs.community.content.initiatives.actions.propose', 'Propose Project')}
                </Button>
                <Button variant="outline">
                  {t('tabs.community.content.initiatives.actions.volunteer', 'Volunteer for Project')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'environmental',
      label: t('tabs.environmental.label', 'Environmental'),
      icon: <Leaf className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-500" />
                {t('tabs.environmental.content.overview.title', 'Environmental Protection Overview')}
              </CardTitle>
              <CardDescription>
                {t('tabs.environmental.content.overview.description', 'Protecting and preserving the UAE\'s natural environment for future generations')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Leaf className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.environmental.content.overview.focus.conservation.title', 'Conservation')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.environmental.content.overview.focus.conservation.description', 'Protecting wildlife habitats and biodiversity')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.environmental.content.overview.focus.sustainability.title', 'Sustainability')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.environmental.content.overview.focus.sustainability.description', 'Promoting sustainable practices and green technologies')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.environmental.content.overview.focus.education.title', 'Education')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.environmental.content.overview.focus.education.description', 'Raising awareness about environmental issues and solutions')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.environmental.content.programs.title', 'Environmental Programs')}</CardTitle>
                <CardDescription>
                  {t('tabs.environmental.content.programs.description', 'Active environmental protection and restoration initiatives')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Leaf className="h-4 w-4 text-green-500" />
                      <span className="font-semibold text-sm">{t('tabs.environmental.content.programs.list.reforestation.title', 'Reforestation Initiative')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.environmental.content.programs.list.reforestation.description', 'Planting native trees to restore natural habitats and combat desertification')}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {t('tabs.environmental.content.programs.list.reforestation.target', '10,000 Trees')}
                      </Badge>
                      <Button size="sm" variant="outline">
                        {t('common.participate', 'Participate')}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold text-sm">{t('tabs.environmental.content.programs.list.marine.title', 'Marine Conservation')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.environmental.content.programs.list.marine.description', 'Protecting coral reefs and marine ecosystems along the UAE coastline')}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {t('tabs.environmental.content.programs.list.marine.coverage', '500km Coastline')}
                      </Badge>
                      <Button size="sm" variant="outline">
                        {t('common.volunteer', 'Volunteer')}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold text-sm">{t('tabs.environmental.content.programs.list.renewable.title', 'Renewable Energy')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.environmental.content.programs.list.renewable.description', 'Supporting solar and wind energy projects across the Emirates')}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {t('tabs.environmental.content.programs.list.renewable.capacity', '2GW Capacity')}
                      </Badge>
                      <Button size="sm" variant="outline">
                        {t('common.support', 'Support')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.environmental.content.achievements.title', 'Environmental Achievements')}</CardTitle>
                <CardDescription>
                  {t('tabs.environmental.content.achievements.description', 'Measurable impact of our environmental protection efforts')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">50,000+</div>
                    <div className="text-sm text-gray-600">{t('tabs.environmental.content.achievements.metrics.trees', 'Trees Planted')}</div>
                    <div className="text-xs text-gray-500 mt-1">{t('tabs.environmental.content.achievements.metrics.treesNote', 'Since 2020')}</div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">2,500 tons</div>
                    <div className="text-sm text-gray-600">{t('tabs.environmental.content.achievements.metrics.waste', 'Waste Collected')}</div>
                    <div className="text-xs text-gray-500 mt-1">{t('tabs.environmental.content.achievements.metrics.wasteNote', 'Beach & park cleanups')}</div>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">15 MW</div>
                    <div className="text-sm text-gray-600">{t('tabs.environmental.content.achievements.metrics.solar', 'Solar Capacity Added')}</div>
                    <div className="text-xs text-gray-500 mt-1">{t('tabs.environmental.content.achievements.metrics.solarNote', 'Community projects')}</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">85%</div>
                    <div className="text-sm text-gray-600">{t('tabs.environmental.content.achievements.metrics.awareness', 'Awareness Increase')}</div>
                    <div className="text-xs text-gray-500 mt-1">{t('tabs.environmental.content.achievements.metrics.awarenessNote', 'Environmental education')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.environmental.content.getInvolved.title', 'Get Involved in Environmental Protection')}</CardTitle>
              <CardDescription>
                {t('tabs.environmental.content.getInvolved.description', 'Multiple ways to contribute to environmental conservation efforts')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.environmental.content.getInvolved.steps.assess.title', 'Environmental Assessment')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.environmental.content.getInvolved.steps.assess.description', 'Evaluate your environmental impact and identify areas for improvement')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.environmental.content.getInvolved.steps.choose.title', 'Choose Initiative')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.environmental.content.getInvolved.steps.choose.description', 'Select environmental programs that align with your interests and schedule')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-yellow-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.environmental.content.getInvolved.steps.train.title', 'Training & Education')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.environmental.content.getInvolved.steps.train.description', 'Participate in environmental education and hands-on training sessions')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">4</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.environmental.content.getInvolved.steps.act.title', 'Take Action')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.environmental.content.getInvolved.steps.act.description', 'Actively participate in conservation projects and spread awareness')}</p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Button size="lg">
                  {t('tabs.environmental.content.getInvolved.action', 'Join Environmental Service')}
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
      title={t('title', 'National Service')}
      description={t('description', 'Serving the nation through dedicated community service and civic engagement')}
      icon={<Shield className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="programs"
    />
  );
};

export default NationalServicePage;

