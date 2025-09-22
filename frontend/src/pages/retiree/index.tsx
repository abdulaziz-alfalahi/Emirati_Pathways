import React from 'react';
import { useLifelongEngagementTranslation } from '@/hooks/useLifelongEngagementTranslation';
import { LifelongEngagementLayout } from '@/components/lifelong-engagement/LifelongEngagementLayout';
import { Users, Heart, Calendar, Award, Shield, BookOpen, Activity, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const RetireeServicesPage: React.FC = () => {
  const { t } = useLifelongEngagementTranslation('retiree');

  const stats = [
    {
      label: t('stats.retireesLabel', 'Active Retirees'),
      value: t('stats.retirees', '15,000+'),
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: t('stats.programsLabel', 'Support Programs'),
      value: t('stats.programs', '45+'),
      icon: Heart,
      color: 'text-red-600'
    },
    {
      label: t('stats.activitiesLabel', 'Monthly Activities'),
      value: t('stats.activities', '120+'),
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      label: t('stats.satisfactionLabel', 'Satisfaction Rate'),
      value: t('stats.satisfaction', '96%'),
      icon: Award,
      color: 'text-purple-600'
    }
  ];

  const tabs = [
    {
      id: 'services',
      label: t('tabs.services.label', 'Retirement Services'),
      icon: <Shield className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                {t('tabs.services.content.overview.title', 'Comprehensive Retirement Support')}
              </CardTitle>
              <CardDescription>
                {t('tabs.services.content.overview.description', 'Supporting our valued retirees with comprehensive services and benefits')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.services.content.overview.categories.financial.title', 'Financial Support')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.services.content.overview.categories.financial.description', 'Pension management and financial planning assistance')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="h-8 w-8 text-red-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.services.content.overview.categories.healthcare.title', 'Healthcare Services')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.services.content.overview.categories.healthcare.description', 'Comprehensive medical care and wellness programs')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.services.content.overview.categories.social.title', 'Social Programs')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.services.content.overview.categories.social.description', 'Community engagement and social activities')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.services.content.financial.title', 'Financial Services')}</CardTitle>
                <CardDescription>
                  {t('tabs.services.content.financial.description', 'Comprehensive financial support and planning services')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.services.content.financial.pension.title', 'Pension Management')}</div>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>{t('tabs.services.content.financial.pension.benefits.monthly', '• Monthly pension payments')}</li>
                      <li>{t('tabs.services.content.financial.pension.benefits.adjustments', '• Annual cost-of-living adjustments')}</li>
                      <li>{t('tabs.services.content.financial.pension.benefits.statements', '• Digital pension statements')}</li>
                      <li>{t('tabs.services.content.financial.pension.benefits.support', '• 24/7 pension support hotline')}</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.services.content.financial.planning.title', 'Financial Planning')}</div>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>{t('tabs.services.content.financial.planning.services.consultation', '• Free financial consultation')}</li>
                      <li>{t('tabs.services.content.financial.planning.services.investment', '• Investment guidance')}</li>
                      <li>{t('tabs.services.content.financial.planning.services.estate', '• Estate planning assistance')}</li>
                      <li>{t('tabs.services.content.financial.planning.services.tax', '• Tax planning support')}</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.services.content.financial.benefits.title', 'Additional Benefits')}</div>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>{t('tabs.services.content.financial.benefits.list.housing', '• Housing allowances')}</li>
                      <li>{t('tabs.services.content.financial.benefits.list.transportation', '• Transportation subsidies')}</li>
                      <li>{t('tabs.services.content.financial.benefits.list.utilities', '• Utility bill assistance')}</li>
                      <li>{t('tabs.services.content.financial.benefits.list.emergency', '• Emergency financial aid')}</li>
                    </ul>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="w-full mt-4">
                  {t('tabs.services.content.financial.action', 'Access Financial Services')}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.services.content.healthcare.title', 'Healthcare & Wellness')}</CardTitle>
                <CardDescription>
                  {t('tabs.services.content.healthcare.description', 'Comprehensive healthcare services tailored for retirees')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.services.content.healthcare.medical.title', 'Medical Services')}</div>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>{t('tabs.services.content.healthcare.medical.services.checkups', '• Regular health checkups')}</li>
                      <li>{t('tabs.services.content.healthcare.medical.services.specialist', '• Specialist consultations')}</li>
                      <li>{t('tabs.services.content.healthcare.medical.services.home', '• Home healthcare visits')}</li>
                      <li>{t('tabs.services.content.healthcare.medical.services.emergency', '• Emergency medical support')}</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.services.content.healthcare.wellness.title', 'Wellness Programs')}</div>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>{t('tabs.services.content.healthcare.wellness.programs.fitness', '• Senior fitness classes')}</li>
                      <li>{t('tabs.services.content.healthcare.wellness.programs.nutrition', '• Nutrition counseling')}</li>
                      <li>{t('tabs.services.content.healthcare.wellness.programs.mental', '• Mental health support')}</li>
                      <li>{t('tabs.services.content.healthcare.wellness.programs.preventive', '• Preventive care programs')}</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.services.content.healthcare.insurance.title', 'Insurance Coverage')}</div>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>{t('tabs.services.content.healthcare.insurance.coverage.comprehensive', '• Comprehensive health insurance')}</li>
                      <li>{t('tabs.services.content.healthcare.insurance.coverage.dental', '• Dental and vision care')}</li>
                      <li>{t('tabs.services.content.healthcare.insurance.coverage.prescription', '• Prescription drug coverage')}</li>
                      <li>{t('tabs.services.content.healthcare.insurance.coverage.international', '• International treatment options')}</li>
                    </ul>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="w-full mt-4">
                  {t('tabs.services.content.healthcare.action', 'Access Healthcare Services')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.services.content.support.title', 'Support & Assistance')}</CardTitle>
              <CardDescription>
                {t('tabs.services.content.support.description', 'Dedicated support services to help retirees navigate their benefits and services')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                    <Phone className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.services.content.support.channels.hotline.title', '24/7 Hotline')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.services.content.support.channels.hotline.description', 'Round-the-clock support for urgent matters')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.services.content.support.channels.centers.title', 'Service Centers')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.services.content.support.channels.centers.description', 'In-person assistance at local centers')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.services.content.support.channels.online.title', 'Online Portal')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.services.content.support.channels.online.description', 'Digital self-service options')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.services.content.support.channels.personal.title', 'Personal Advisor')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.services.content.support.channels.personal.description', 'Dedicated advisor for complex cases')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'opportunities',
      label: t('tabs.opportunities.label', 'Engagement Opportunities'),
      icon: <Activity className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                {t('tabs.opportunities.content.overview.title', 'Stay Active & Engaged')}
              </CardTitle>
              <CardDescription>
                {t('tabs.opportunities.content.overview.description', 'Meaningful opportunities for retirees to stay active and contribute to society')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.opportunities.content.overview.categories.volunteer.title', 'Volunteer Work')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.opportunities.content.overview.categories.volunteer.description', 'Give back to the community through volunteer opportunities')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.opportunities.content.overview.categories.mentoring.title', 'Mentoring Programs')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.opportunities.content.overview.categories.mentoring.description', 'Share your expertise with younger generations')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-8 w-8 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.opportunities.content.overview.categories.consulting.title', 'Consulting Roles')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.opportunities.content.overview.categories.consulting.description', 'Provide professional expertise on a consulting basis')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.opportunities.content.volunteer.title', 'Volunteer Opportunities')}</CardTitle>
                <CardDescription>
                  {t('tabs.opportunities.content.volunteer.description', 'Make a difference in your community through volunteer work')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.opportunities.content.volunteer.areas.education.title', 'Education Support')}</div>
                    <p className="text-xs text-gray-600 mb-2">{t('tabs.opportunities.content.volunteer.areas.education.description', 'Help students with tutoring, reading programs, and career guidance')}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.opportunities.content.volunteer.areas.education.commitment', '4-6 hours/week')}</Badge>
                      <Button variant="outline" size="sm">{t('tabs.opportunities.content.volunteer.areas.education.action', 'Learn More')}</Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.opportunities.content.volunteer.areas.healthcare.title', 'Healthcare Assistance')}</div>
                    <p className="text-xs text-gray-600 mb-2">{t('tabs.opportunities.content.volunteer.areas.healthcare.description', 'Support healthcare facilities with patient care and administrative tasks')}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.opportunities.content.volunteer.areas.healthcare.commitment', '6-8 hours/week')}</Badge>
                      <Button variant="outline" size="sm">{t('tabs.opportunities.content.volunteer.areas.healthcare.action', 'Learn More')}</Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.opportunities.content.volunteer.areas.community.title', 'Community Development')}</div>
                    <p className="text-xs text-gray-600 mb-2">{t('tabs.opportunities.content.volunteer.areas.community.description', 'Participate in community improvement projects and social initiatives')}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.opportunities.content.volunteer.areas.community.commitment', '3-5 hours/week')}</Badge>
                      <Button variant="outline" size="sm">{t('tabs.opportunities.content.volunteer.areas.community.action', 'Learn More')}</Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.opportunities.content.volunteer.areas.environment.title', 'Environmental Conservation')}</div>
                    <p className="text-xs text-gray-600 mb-2">{t('tabs.opportunities.content.volunteer.areas.environment.description', 'Join environmental protection and sustainability initiatives')}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{t('tabs.opportunities.content.volunteer.areas.environment.commitment', '2-4 hours/week')}</Badge>
                      <Button variant="outline" size="sm">{t('tabs.opportunities.content.volunteer.areas.environment.action', 'Learn More')}</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.opportunities.content.mentoring.title', 'Mentoring & Knowledge Sharing')}</CardTitle>
                <CardDescription>
                  {t('tabs.opportunities.content.mentoring.description', 'Share your professional experience and life wisdom with others')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.opportunities.content.mentoring.programs.professional.title', 'Professional Mentoring')}</div>
                    <p className="text-xs text-gray-600 mb-2">{t('tabs.opportunities.content.mentoring.programs.professional.description', 'Guide young professionals in their career development')}</p>
                    <ul className="space-y-1 text-xs text-gray-600 mb-2">
                      <li>{t('tabs.opportunities.content.mentoring.programs.professional.activities.career', '• Career planning sessions')}</li>
                      <li>{t('tabs.opportunities.content.mentoring.programs.professional.activities.skills', '• Skills development workshops')}</li>
                      <li>{t('tabs.opportunities.content.mentoring.programs.professional.activities.networking', '• Professional networking events')}</li>
                    </ul>
                    <Button variant="outline" size="sm" className="w-full">{t('tabs.opportunities.content.mentoring.programs.professional.action', 'Become a Mentor')}</Button>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.opportunities.content.mentoring.programs.entrepreneurship.title', 'Entrepreneurship Guidance')}</div>
                    <p className="text-xs text-gray-600 mb-2">{t('tabs.opportunities.content.mentoring.programs.entrepreneurship.description', 'Support aspiring entrepreneurs with business insights')}</p>
                    <ul className="space-y-1 text-xs text-gray-600 mb-2">
                      <li>{t('tabs.opportunities.content.mentoring.programs.entrepreneurship.activities.planning', '• Business plan reviews')}</li>
                      <li>{t('tabs.opportunities.content.mentoring.programs.entrepreneurship.activities.strategy', '• Strategic advice sessions')}</li>
                      <li>{t('tabs.opportunities.content.mentoring.programs.entrepreneurship.activities.connections', '• Industry connections')}</li>
                    </ul>
                    <Button variant="outline" size="sm" className="w-full">{t('tabs.opportunities.content.mentoring.programs.entrepreneurship.action', 'Join Program')}</Button>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.opportunities.content.mentoring.programs.life.title', 'Life Skills Coaching')}</div>
                    <p className="text-xs text-gray-600 mb-2">{t('tabs.opportunities.content.mentoring.programs.life.description', 'Share life wisdom and personal development insights')}</p>
                    <ul className="space-y-1 text-xs text-gray-600 mb-2">
                      <li>{t('tabs.opportunities.content.mentoring.programs.life.activities.personal', '• Personal development sessions')}</li>
                      <li>{t('tabs.opportunities.content.mentoring.programs.life.activities.financial', '• Financial literacy workshops')}</li>
                      <li>{t('tabs.opportunities.content.mentoring.programs.life.activities.wellness', '• Wellness and balance guidance')}</li>
                    </ul>
                    <Button variant="outline" size="sm" className="w-full">{t('tabs.opportunities.content.mentoring.programs.life.action', 'Get Involved')}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.opportunities.content.consulting.title', 'Consulting & Advisory Roles')}</CardTitle>
              <CardDescription>
                {t('tabs.opportunities.content.consulting.description', 'Leverage your professional expertise in consulting and advisory positions')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="font-semibold text-sm mb-2">{t('tabs.opportunities.content.consulting.roles.government.title', 'Government Advisory')}</div>
                  <p className="text-xs text-gray-600 mb-3">{t('tabs.opportunities.content.consulting.roles.government.description', 'Provide expertise to government agencies and policy development')}</p>
                  <div className="space-y-2 text-xs text-gray-600 mb-3">
                    <div>{t('tabs.opportunities.content.consulting.roles.government.areas.policy', '• Policy development')}</div>
                    <div>{t('tabs.opportunities.content.consulting.roles.government.areas.strategic', '• Strategic planning')}</div>
                    <div>{t('tabs.opportunities.content.consulting.roles.government.areas.evaluation', '• Program evaluation')}</div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">{t('tabs.opportunities.content.consulting.roles.government.action', 'Apply')}</Button>
                </div>
                
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <div className="font-semibold text-sm mb-2">{t('tabs.opportunities.content.consulting.roles.private.title', 'Private Sector Consulting')}</div>
                  <p className="text-xs text-gray-600 mb-3">{t('tabs.opportunities.content.consulting.roles.private.description', 'Offer specialized consulting services to businesses and organizations')}</p>
                  <div className="space-y-2 text-xs text-gray-600 mb-3">
                    <div>{t('tabs.opportunities.content.consulting.roles.private.areas.management', '• Management consulting')}</div>
                    <div>{t('tabs.opportunities.content.consulting.roles.private.areas.technical', '• Technical expertise')}</div>
                    <div>{t('tabs.opportunities.content.consulting.roles.private.areas.training', '• Training and development')}</div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">{t('tabs.opportunities.content.consulting.roles.private.action', 'Register')}</Button>
                </div>
                
                <div className="p-4 bg-pink-50 rounded-lg">
                  <div className="font-semibold text-sm mb-2">{t('tabs.opportunities.content.consulting.roles.nonprofit.title', 'Non-Profit Advisory')}</div>
                  <p className="text-xs text-gray-600 mb-3">{t('tabs.opportunities.content.consulting.roles.nonprofit.description', 'Support non-profit organizations with governance and strategic guidance')}</p>
                  <div className="space-y-2 text-xs text-gray-600 mb-3">
                    <div>{t('tabs.opportunities.content.consulting.roles.nonprofit.areas.governance', '• Board governance')}</div>
                    <div>{t('tabs.opportunities.content.consulting.roles.nonprofit.areas.fundraising', '• Fundraising strategy')}</div>
                    <div>{t('tabs.opportunities.content.consulting.roles.nonprofit.areas.operations', '• Operations improvement')}</div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">{t('tabs.opportunities.content.consulting.roles.nonprofit.action', 'Volunteer')}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'benefits',
      label: t('tabs.benefits.label', 'Benefits & Perks'),
      icon: <Award className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-500" />
                {t('tabs.benefits.content.overview.title', 'Exclusive Retiree Benefits')}
              </CardTitle>
              <CardDescription>
                {t('tabs.benefits.content.overview.description', 'Comprehensive benefits package designed specifically for our valued retirees')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.benefits.content.overview.categories.discounts.title', 'Discounts')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.benefits.content.overview.categories.discounts.description', 'Special pricing on services and products')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.benefits.content.overview.categories.recreation.title', 'Recreation')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.benefits.content.overview.categories.recreation.description', 'Access to recreational facilities and activities')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.benefits.content.overview.categories.education.title', 'Education')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.benefits.content.overview.categories.education.description', 'Lifelong learning opportunities and courses')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="h-6 w-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.benefits.content.overview.categories.wellness.title', 'Wellness')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.benefits.content.overview.categories.wellness.description', 'Health and wellness programs and services')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.benefits.content.discounts.title', 'Exclusive Discounts')}</CardTitle>
                <CardDescription>
                  {t('tabs.benefits.content.discounts.description', 'Special pricing and offers available to retirees')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.benefits.content.discounts.categories.retail.title', 'Retail & Shopping')}</div>
                    <ul className="space-y-1 text-xs text-gray-600 mb-2">
                      <li>{t('tabs.benefits.content.discounts.categories.retail.offers.groceries', '• 15% off groceries at partner stores')}</li>
                      <li>{t('tabs.benefits.content.discounts.categories.retail.offers.clothing', '• 20% off clothing and accessories')}</li>
                      <li>{t('tabs.benefits.content.discounts.categories.retail.offers.electronics', '• 10% off electronics and appliances')}</li>
                      <li>{t('tabs.benefits.content.discounts.categories.retail.offers.pharmacy', '• Special pharmacy discounts')}</li>
                    </ul>
                    <Badge variant="outline" className="text-xs">{t('tabs.benefits.content.discounts.categories.retail.partners', '150+ Partner Stores')}</Badge>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.benefits.content.discounts.categories.travel.title', 'Travel & Transportation')}</div>
                    <ul className="space-y-1 text-xs text-gray-600 mb-2">
                      <li>{t('tabs.benefits.content.discounts.categories.travel.offers.flights', '• Discounted domestic flights')}</li>
                      <li>{t('tabs.benefits.content.discounts.categories.travel.offers.hotels', '• Hotel and resort discounts')}</li>
                      <li>{t('tabs.benefits.content.discounts.categories.travel.offers.transport', '• Free public transportation')}</li>
                      <li>{t('tabs.benefits.content.discounts.categories.travel.offers.tours', '• Group tour packages')}</li>
                    </ul>
                    <Badge variant="outline" className="text-xs">{t('tabs.benefits.content.discounts.categories.travel.savings', 'Up to 30% Savings')}</Badge>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.benefits.content.discounts.categories.dining.title', 'Dining & Entertainment')}</div>
                    <ul className="space-y-1 text-xs text-gray-600 mb-2">
                      <li>{t('tabs.benefits.content.discounts.categories.dining.offers.restaurants', '• Restaurant meal discounts')}</li>
                      <li>{t('tabs.benefits.content.discounts.categories.dining.offers.cinema', '• Cinema and theater tickets')}</li>
                      <li>{t('tabs.benefits.content.discounts.categories.dining.offers.events', '• Cultural events and exhibitions')}</li>
                      <li>{t('tabs.benefits.content.discounts.categories.dining.offers.sports', '• Sports events and activities')}</li>
                    </ul>
                    <Badge variant="outline" className="text-xs">{t('tabs.benefits.content.discounts.categories.dining.partners', '200+ Venues')}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.benefits.content.recreation.title', 'Recreation & Leisure')}</CardTitle>
                <CardDescription>
                  {t('tabs.benefits.content.recreation.description', 'Access to recreational facilities and organized activities')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.benefits.content.recreation.facilities.title', 'Recreational Facilities')}</div>
                    <ul className="space-y-1 text-xs text-gray-600 mb-2">
                      <li>{t('tabs.benefits.content.recreation.facilities.access.fitness', '• Fitness centers and gyms')}</li>
                      <li>{t('tabs.benefits.content.recreation.facilities.access.pools', '• Swimming pools and aquatic centers')}</li>
                      <li>{t('tabs.benefits.content.recreation.facilities.access.courts', '• Tennis and sports courts')}</li>
                      <li>{t('tabs.benefits.content.recreation.facilities.access.gardens', '• Community gardens and parks')}</li>
                    </ul>
                    <Badge variant="outline" className="text-xs">{t('tabs.benefits.content.recreation.facilities.locations', '25 Locations')}</Badge>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.benefits.content.recreation.activities.title', 'Organized Activities')}</div>
                    <ul className="space-y-1 text-xs text-gray-600 mb-2">
                      <li>{t('tabs.benefits.content.recreation.activities.programs.social', '• Social clubs and meetups')}</li>
                      <li>{t('tabs.benefits.content.recreation.activities.programs.hobby', '• Hobby and craft workshops')}</li>
                      <li>{t('tabs.benefits.content.recreation.activities.programs.cultural', '• Cultural and educational trips')}</li>
                      <li>{t('tabs.benefits.content.recreation.activities.programs.sports', '• Senior sports leagues')}</li>
                    </ul>
                    <Badge variant="outline" className="text-xs">{t('tabs.benefits.content.recreation.activities.weekly', '50+ Weekly Activities')}</Badge>
                  </div>
                  
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.benefits.content.recreation.special.title', 'Special Events')}</div>
                    <ul className="space-y-1 text-xs text-gray-600 mb-2">
                      <li>{t('tabs.benefits.content.recreation.special.events.annual', '• Annual retiree celebration')}</li>
                      <li>{t('tabs.benefits.content.recreation.special.events.seasonal', '• Seasonal festivals and gatherings')}</li>
                      <li>{t('tabs.benefits.content.recreation.special.events.recognition', '• Achievement recognition ceremonies')}</li>
                      <li>{t('tabs.benefits.content.recreation.special.events.networking', '• Networking and reunion events')}</li>
                    </ul>
                    <Badge variant="outline" className="text-xs">{t('tabs.benefits.content.recreation.special.frequency', 'Monthly Events')}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.benefits.content.education.title', 'Lifelong Learning Benefits')}</CardTitle>
              <CardDescription>
                {t('tabs.benefits.content.education.description', 'Continue your educational journey with specialized programs for retirees')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-sm mb-2">{t('tabs.benefits.content.education.programs.university.title', 'University Programs')}</div>
                  <p className="text-xs text-gray-600 mb-3">{t('tabs.benefits.content.education.programs.university.description', 'Audit university courses and attend lectures')}</p>
                  <ul className="space-y-1 text-xs text-gray-600 mb-3">
                    <li>{t('tabs.benefits.content.education.programs.university.offerings.courses', '• Free course auditing')}</li>
                    <li>{t('tabs.benefits.content.education.programs.university.offerings.lectures', '• Guest lecture series')}</li>
                    <li>{t('tabs.benefits.content.education.programs.university.offerings.library', '• Library access privileges')}</li>
                  </ul>
                  <Button variant="outline" size="sm" className="w-full">{t('tabs.benefits.content.education.programs.university.action', 'Explore Courses')}</Button>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="font-semibold text-sm mb-2">{t('tabs.benefits.content.education.programs.skills.title', 'Skills Development')}</div>
                  <p className="text-xs text-gray-600 mb-3">{t('tabs.benefits.content.education.programs.skills.description', 'Learn new skills and technologies')}</p>
                  <ul className="space-y-1 text-xs text-gray-600 mb-3">
                    <li>{t('tabs.benefits.content.education.programs.skills.offerings.digital', '• Digital literacy courses')}</li>
                    <li>{t('tabs.benefits.content.education.programs.skills.offerings.languages', '• Language learning programs')}</li>
                    <li>{t('tabs.benefits.content.education.programs.skills.offerings.creative', '• Creative arts workshops')}</li>
                  </ul>
                  <Button variant="outline" size="sm" className="w-full">{t('tabs.benefits.content.education.programs.skills.action', 'Join Workshops')}</Button>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="font-semibold text-sm mb-2">{t('tabs.benefits.content.education.programs.personal.title', 'Personal Enrichment')}</div>
                  <p className="text-xs text-gray-600 mb-3">{t('tabs.benefits.content.education.programs.personal.description', 'Pursue personal interests and hobbies')}</p>
                  <ul className="space-y-1 text-xs text-gray-600 mb-3">
                    <li>{t('tabs.benefits.content.education.programs.personal.offerings.history', '• History and culture studies')}</li>
                    <li>{t('tabs.benefits.content.education.programs.personal.offerings.wellness', '• Health and wellness education')}</li>
                    <li>{t('tabs.benefits.content.education.programs.personal.offerings.finance', '• Financial planning courses')}</li>
                  </ul>
                  <Button variant="outline" size="sm" className="w-full">{t('tabs.benefits.content.education.programs.personal.action', 'Browse Topics')}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'wellness',
      label: t('tabs.wellness.label', 'Health & Wellness'),
      icon: <Heart className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                {t('tabs.wellness.content.overview.title', 'Comprehensive Wellness Programs')}
              </CardTitle>
              <CardDescription>
                {t('tabs.wellness.content.overview.description', 'Holistic health and wellness support designed for the unique needs of retirees')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="h-6 w-6 text-red-600" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.wellness.content.overview.pillars.physical.title', 'Physical Health')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.wellness.content.overview.pillars.physical.description', 'Fitness, nutrition, and preventive care')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.wellness.content.overview.pillars.mental.title', 'Mental Health')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.wellness.content.overview.pillars.mental.description', 'Cognitive health and emotional wellbeing')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.wellness.content.overview.pillars.social.title', 'Social Wellness')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.wellness.content.overview.pillars.social.description', 'Community connections and relationships')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.wellness.content.overview.pillars.spiritual.title', 'Spiritual Health')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.wellness.content.overview.pillars.spiritual.description', 'Purpose, meaning, and inner peace')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.wellness.content.physical.title', 'Physical Health Programs')}</CardTitle>
                <CardDescription>
                  {t('tabs.wellness.content.physical.description', 'Comprehensive physical health support and fitness programs')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.wellness.content.physical.fitness.title', 'Senior Fitness Programs')}</div>
                    <ul className="space-y-1 text-xs text-gray-600 mb-2">
                      <li>{t('tabs.wellness.content.physical.fitness.programs.water', '• Water aerobics and swimming')}</li>
                      <li>{t('tabs.wellness.content.physical.fitness.programs.yoga', '• Gentle yoga and stretching')}</li>
                      <li>{t('tabs.wellness.content.physical.fitness.programs.walking', '• Walking groups and hiking')}</li>
                      <li>{t('tabs.wellness.content.physical.fitness.programs.strength', '• Strength training for seniors')}</li>
                    </ul>
                    <Badge variant="outline" className="text-xs">{t('tabs.wellness.content.physical.fitness.schedule', '20+ Classes Weekly')}</Badge>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.wellness.content.physical.nutrition.title', 'Nutrition & Wellness')}</div>
                    <ul className="space-y-1 text-xs text-gray-600 mb-2">
                      <li>{t('tabs.wellness.content.physical.nutrition.services.counseling', '• Nutritional counseling')}</li>
                      <li>{t('tabs.wellness.content.physical.nutrition.services.planning', '• Meal planning assistance')}</li>
                      <li>{t('tabs.wellness.content.physical.nutrition.services.cooking', '• Healthy cooking classes')}</li>
                      <li>{t('tabs.wellness.content.physical.nutrition.services.supplements', '• Supplement guidance')}</li>
                    </ul>
                    <Badge variant="outline" className="text-xs">{t('tabs.wellness.content.physical.nutrition.availability', 'Free Consultations')}</Badge>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.wellness.content.physical.preventive.title', 'Preventive Care')}</div>
                    <ul className="space-y-1 text-xs text-gray-600 mb-2">
                      <li>{t('tabs.wellness.content.physical.preventive.services.screenings', '• Regular health screenings')}</li>
                      <li>{t('tabs.wellness.content.physical.preventive.services.vaccinations', '• Vaccination programs')}</li>
                      <li>{t('tabs.wellness.content.physical.preventive.services.monitoring', '• Chronic condition monitoring')}</li>
                      <li>{t('tabs.wellness.content.physical.preventive.services.education', '• Health education workshops')}</li>
                    </ul>
                    <Badge variant="outline" className="text-xs">{t('tabs.wellness.content.physical.preventive.coverage', 'Fully Covered')}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.wellness.content.mental.title', 'Mental Health & Cognitive Wellness')}</CardTitle>
                <CardDescription>
                  {t('tabs.wellness.content.mental.description', 'Support for mental health and cognitive function maintenance')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.wellness.content.mental.cognitive.title', 'Cognitive Health Programs')}</div>
                    <ul className="space-y-1 text-xs text-gray-600 mb-2">
                      <li>{t('tabs.wellness.content.mental.cognitive.activities.memory', '• Memory enhancement exercises')}</li>
                      <li>{t('tabs.wellness.content.mental.cognitive.activities.brain', '• Brain training games and puzzles')}</li>
                      <li>{t('tabs.wellness.content.mental.cognitive.activities.learning', '• Continuous learning programs')}</li>
                      <li>{t('tabs.wellness.content.mental.cognitive.activities.reading', '• Reading and discussion groups')}</li>
                    </ul>
                    <Badge variant="outline" className="text-xs">{t('tabs.wellness.content.mental.cognitive.frequency', 'Daily Activities')}</Badge>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.wellness.content.mental.emotional.title', 'Emotional Support Services')}</div>
                    <ul className="space-y-1 text-xs text-gray-600 mb-2">
                      <li>{t('tabs.wellness.content.mental.emotional.services.counseling', '• Individual counseling sessions')}</li>
                      <li>{t('tabs.wellness.content.mental.emotional.services.group', '• Support group meetings')}</li>
                      <li>{t('tabs.wellness.content.mental.emotional.services.grief', '• Grief and loss counseling')}</li>
                      <li>{t('tabs.wellness.content.mental.emotional.services.stress', '• Stress management workshops')}</li>
                    </ul>
                    <Badge variant="outline" className="text-xs">{t('tabs.wellness.content.mental.emotional.access', 'Confidential & Free')}</Badge>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="font-semibold text-sm mb-2">{t('tabs.wellness.content.mental.mindfulness.title', 'Mindfulness & Relaxation')}</div>
                    <ul className="space-y-1 text-xs text-gray-600 mb-2">
                      <li>{t('tabs.wellness.content.mental.mindfulness.practices.meditation', '• Guided meditation sessions')}</li>
                      <li>{t('tabs.wellness.content.mental.mindfulness.practices.breathing', '• Breathing and relaxation techniques')}</li>
                      <li>{t('tabs.wellness.content.mental.mindfulness.practices.tai', '• Tai Chi and mindful movement')}</li>
                      <li>{t('tabs.wellness.content.mental.mindfulness.practices.nature', '• Nature therapy programs')}</li>
                    </ul>
                    <Badge variant="outline" className="text-xs">{t('tabs.wellness.content.mental.mindfulness.schedule', 'Multiple Sessions Daily')}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.wellness.content.social.title', 'Social Wellness & Community Connection')}</CardTitle>
              <CardDescription>
                {t('tabs.wellness.content.social.description', 'Building and maintaining meaningful social connections and community engagement')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <div className="font-semibold text-sm mb-2">{t('tabs.wellness.content.social.community.title', 'Community Groups')}</div>
                  <p className="text-xs text-gray-600 mb-3">{t('tabs.wellness.content.social.community.description', 'Join interest-based groups and social clubs')}</p>
                  <ul className="space-y-1 text-xs text-gray-600 mb-3">
                    <li>{t('tabs.wellness.content.social.community.groups.hobby', '• Hobby and craft circles')}</li>
                    <li>{t('tabs.wellness.content.social.community.groups.book', '• Book clubs and literary societies')}</li>
                    <li>{t('tabs.wellness.content.social.community.groups.cultural', '• Cultural appreciation groups')}</li>
                    <li>{t('tabs.wellness.content.social.community.groups.volunteer', '• Volunteer organizations')}</li>
                  </ul>
                  <Button variant="outline" size="sm" className="w-full">{t('tabs.wellness.content.social.community.action', 'Find Groups')}</Button>
                </div>
                
                <div className="p-4 bg-pink-50 rounded-lg">
                  <div className="font-semibold text-sm mb-2">{t('tabs.wellness.content.social.intergenerational.title', 'Intergenerational Programs')}</div>
                  <p className="text-xs text-gray-600 mb-3">{t('tabs.wellness.content.social.intergenerational.description', 'Connect with younger generations through structured programs')}</p>
                  <ul className="space-y-1 text-xs text-gray-600 mb-3">
                    <li>{t('tabs.wellness.content.social.intergenerational.programs.mentoring', '• Youth mentoring initiatives')}</li>
                    <li>{t('tabs.wellness.content.social.intergenerational.programs.storytelling', '• Storytelling and oral history')}</li>
                    <li>{t('tabs.wellness.content.social.intergenerational.programs.skills', '• Skills exchange programs')}</li>
                    <li>{t('tabs.wellness.content.social.intergenerational.programs.activities', '• Joint recreational activities')}</li>
                  </ul>
                  <Button variant="outline" size="sm" className="w-full">{t('tabs.wellness.content.social.intergenerational.action', 'Get Involved')}</Button>
                </div>
                
                <div className="p-4 bg-teal-50 rounded-lg">
                  <div className="font-semibold text-sm mb-2">{t('tabs.wellness.content.social.events.title', 'Social Events & Gatherings')}</div>
                  <p className="text-xs text-gray-600 mb-3">{t('tabs.wellness.content.social.events.description', 'Regular social events and special celebrations')}</p>
                  <ul className="space-y-1 text-xs text-gray-600 mb-3">
                    <li>{t('tabs.wellness.content.social.events.calendar.weekly', '• Weekly coffee meetups')}</li>
                    <li>{t('tabs.wellness.content.social.events.calendar.monthly', '• Monthly themed dinners')}</li>
                    <li>{t('tabs.wellness.content.social.events.calendar.seasonal', '• Seasonal celebrations')}</li>
                    <li>{t('tabs.wellness.content.social.events.calendar.special', '• Special milestone celebrations')}</li>
                  </ul>
                  <Button variant="outline" size="sm" className="w-full">{t('tabs.wellness.content.social.events.action', 'View Calendar')}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ];

  return (
    <LifelongEngagementLayout
      title={t('title', 'Retiree Services')}
      description={t('description', 'Comprehensive support and services for our valued retirees, ensuring a fulfilling and secure retirement')}
      icon={<Users className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="services"
    />
  );
};

export default RetireeServicesPage;

