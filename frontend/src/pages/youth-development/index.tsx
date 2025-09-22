import React from 'react';
import { useLifelongEngagementTranslation } from '@/hooks/useLifelongEngagementTranslation';
import { LifelongEngagementLayout } from '@/components/lifelong-engagement/LifelongEngagementLayout';
import { Users, Target, BookOpen, Award, Calendar, Heart, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const YouthDevelopmentPage: React.FC = () => {
  const { t } = useLifelongEngagementTranslation('youth-development');

  const stats = [
    {
      label: t('stats.participantsLabel', 'Active Participants'),
      value: t('stats.participants', '12,500+'),
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: t('stats.programsLabel', 'Development Programs'),
      value: t('stats.programs', '85+'),
      icon: Target,
      color: 'text-green-600'
    },
    {
      label: t('stats.mentorsLabel', 'Expert Mentors'),
      value: t('stats.mentors', '200+'),
      icon: Award,
      color: 'text-purple-600'
    },
    {
      label: t('stats.successRateLabel', 'Success Rate'),
      value: t('stats.successRate', '94%'),
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ];

  const tabs = [
    {
      id: 'programs',
      label: t('tabs.programs.label', 'Programs'),
      icon: <Target className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  {t('tabs.programs.content.education.title', 'Educational Excellence')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.programs.content.education.description', 'Academic achievement and learning enhancement programs')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {t('tabs.programs.content.education.features.scholarships', 'Merit-based scholarships')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {t('tabs.programs.content.education.features.tutoring', 'Academic tutoring support')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {t('tabs.programs.content.education.features.research', 'Research opportunities')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {t('tabs.programs.content.education.features.exchange', 'International exchange programs')}
                  </li>
                </ul>
                <Button variant="outline" size="sm" className="w-full">
                  {t('common.learnMore', 'Learn More')}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  {t('tabs.programs.content.career.title', 'Career Development')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.programs.content.career.description', 'Professional skills and career preparation programs')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {t('tabs.programs.content.career.features.internships', 'Government internships')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {t('tabs.programs.content.career.features.workshops', 'Professional workshops')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {t('tabs.programs.content.career.features.networking', 'Industry networking events')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {t('tabs.programs.content.career.features.placement', 'Job placement assistance')}
                  </li>
                </ul>
                <Button variant="outline" size="sm" className="w-full">
                  {t('common.apply', 'Apply Now')}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  {t('tabs.programs.content.personal.title', 'Personal Growth')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.programs.content.personal.description', 'Character building and personal development initiatives')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('tabs.programs.content.personal.features.wellness', 'Mental wellness programs')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('tabs.programs.content.personal.features.confidence', 'Confidence building workshops')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('tabs.programs.content.personal.features.communication', 'Communication skills training')}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('tabs.programs.content.personal.features.cultural', 'Cultural awareness programs')}
                  </li>
                </ul>
                <Button variant="outline" size="sm" className="w-full">
                  {t('common.explore', 'Explore Programs')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.programs.content.featured.title', 'Featured Program: Future Leaders Initiative')}</CardTitle>
              <CardDescription>
                {t('tabs.programs.content.featured.description', 'A comprehensive 12-month program designed to develop the next generation of Emirati leaders')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">{t('tabs.programs.content.featured.highlights.title', 'Program Highlights')}</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.programs.content.featured.highlights.mentorship', 'One-on-one mentorship with senior leaders')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.programs.content.featured.highlights.projects', 'Real-world project assignments')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.programs.content.featured.highlights.international', 'International exposure opportunities')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.programs.content.featured.highlights.certification', 'Leadership certification upon completion')}
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">{t('tabs.programs.content.featured.requirements.title', 'Eligibility Requirements')}</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {t('tabs.programs.content.featured.requirements.age', 'Age 18-25 years')}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {t('tabs.programs.content.featured.requirements.citizen', 'UAE citizen or resident')}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {t('tabs.programs.content.featured.requirements.education', 'High school diploma or equivalent')}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {t('tabs.programs.content.featured.requirements.commitment', 'Full program commitment')}
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <Button>
                  {t('tabs.programs.content.featured.actions.apply', 'Apply for Program')}
                </Button>
                <Button variant="outline">
                  {t('tabs.programs.content.featured.actions.info', 'Request Information')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'leadership',
      label: t('tabs.leadership.label', 'Leadership'),
      icon: <Award className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-500" />
                {t('tabs.leadership.content.development.title', 'Leadership Development Pathway')}
              </CardTitle>
              <CardDescription>
                {t('tabs.leadership.content.development.description', 'Structured progression through leadership competencies and experiences')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-semibold">{t('tabs.leadership.content.development.stages.foundation.title', 'Foundation Level')}</h4>
                    <p className="text-sm text-gray-600">{t('tabs.leadership.content.development.stages.foundation.description', 'Basic leadership principles and self-awareness development')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-semibold">{t('tabs.leadership.content.development.stages.intermediate.title', 'Intermediate Level')}</h4>
                    <p className="text-sm text-gray-600">{t('tabs.leadership.content.development.stages.intermediate.description', 'Team leadership and project management skills')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-semibold">{t('tabs.leadership.content.development.stages.advanced.title', 'Advanced Level')}</h4>
                    <p className="text-sm text-gray-600">{t('tabs.leadership.content.development.stages.advanced.description', 'Strategic thinking and organizational leadership')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-semibold">{t('tabs.leadership.content.development.stages.mastery.title', 'Mastery Level')}</h4>
                    <p className="text-sm text-gray-600">{t('tabs.leadership.content.development.stages.mastery.description', 'Visionary leadership and mentoring others')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.leadership.content.opportunities.title', 'Leadership Opportunities')}</CardTitle>
                <CardDescription>
                  {t('tabs.leadership.content.opportunities.description', 'Real-world leadership experiences and responsibilities')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <Users className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{t('tabs.leadership.content.opportunities.items.student.title', 'Student Government')}</div>
                      <div className="text-xs text-gray-600">{t('tabs.leadership.content.opportunities.items.student.description', 'Lead student councils and represent peer interests')}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <Target className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{t('tabs.leadership.content.opportunities.items.community.title', 'Community Projects')}</div>
                      <div className="text-xs text-gray-600">{t('tabs.leadership.content.opportunities.items.community.description', 'Lead community service and development initiatives')}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                      <Award className="h-3 w-3 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{t('tabs.leadership.content.opportunities.items.youth.title', 'Youth Councils')}</div>
                      <div className="text-xs text-gray-600">{t('tabs.leadership.content.opportunities.items.youth.description', 'Participate in government youth advisory bodies')}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                      <BookOpen className="h-3 w-3 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{t('tabs.leadership.content.opportunities.items.entrepreneurship.title', 'Entrepreneurship Programs')}</div>
                      <div className="text-xs text-gray-600">{t('tabs.leadership.content.opportunities.items.entrepreneurship.description', 'Lead startup initiatives and business ventures')}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.leadership.content.recognition.title', 'Recognition & Awards')}</CardTitle>
                <CardDescription>
                  {t('tabs.leadership.content.recognition.description', 'Celebrating outstanding youth leadership achievements')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold text-sm">{t('tabs.leadership.content.recognition.awards.excellence.title', 'Youth Leadership Excellence Award')}</span>
                    </div>
                    <p className="text-xs text-gray-600">{t('tabs.leadership.content.recognition.awards.excellence.description', 'Annual recognition for exceptional leadership impact')}</p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold text-sm">{t('tabs.leadership.content.recognition.awards.innovation.title', 'Innovation Leadership Prize')}</span>
                    </div>
                    <p className="text-xs text-gray-600">{t('tabs.leadership.content.recognition.awards.innovation.description', 'Recognizing creative solutions and innovative thinking')}</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-4 w-4 text-green-500" />
                      <span className="font-semibold text-sm">{t('tabs.leadership.content.recognition.awards.community.title', 'Community Impact Recognition')}</span>
                    </div>
                    <p className="text-xs text-gray-600">{t('tabs.leadership.content.recognition.awards.community.description', 'Honoring significant community service contributions')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'skills',
      label: t('tabs.skills.label', 'Skills'),
      icon: <BookOpen className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  {t('tabs.skills.content.technical.title', 'Technical Skills')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.skills.content.technical.description', 'Digital literacy and technology competencies')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('tabs.skills.content.technical.skills.programming', 'Programming')}</span>
                    <Badge variant="outline">{t('tabs.skills.content.technical.levels.beginner', 'Beginner')}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('tabs.skills.content.technical.skills.dataAnalysis', 'Data Analysis')}</span>
                    <Badge variant="outline">{t('tabs.skills.content.technical.levels.intermediate', 'Intermediate')}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('tabs.skills.content.technical.skills.digitalMarketing', 'Digital Marketing')}</span>
                    <Badge variant="outline">{t('tabs.skills.content.technical.levels.advanced', 'Advanced')}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('tabs.skills.content.technical.skills.cybersecurity', 'Cybersecurity')}</span>
                    <Badge variant="outline">{t('tabs.skills.content.technical.levels.beginner', 'Beginner')}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  {t('tabs.skills.content.technical.action', 'Explore Courses')}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  {t('tabs.skills.content.soft.title', 'Soft Skills')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.skills.content.soft.description', 'Interpersonal and communication abilities')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('tabs.skills.content.soft.skills.communication', 'Communication')}</span>
                    <Badge variant="secondary">{t('tabs.skills.content.soft.levels.advanced', 'Advanced')}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('tabs.skills.content.soft.skills.teamwork', 'Teamwork')}</span>
                    <Badge variant="secondary">{t('tabs.skills.content.soft.levels.intermediate', 'Intermediate')}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('tabs.skills.content.soft.skills.problemSolving', 'Problem Solving')}</span>
                    <Badge variant="secondary">{t('tabs.skills.content.soft.levels.advanced', 'Advanced')}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('tabs.skills.content.soft.skills.timeManagement', 'Time Management')}</span>
                    <Badge variant="secondary">{t('tabs.skills.content.soft.levels.intermediate', 'Intermediate')}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  {t('tabs.skills.content.soft.action', 'Join Workshops')}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  {t('tabs.skills.content.professional.title', 'Professional Skills')}
                </CardTitle>
                <CardDescription>
                  {t('tabs.skills.content.professional.description', 'Career-focused competencies and expertise')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('tabs.skills.content.professional.skills.projectManagement', 'Project Management')}</span>
                    <Badge variant="destructive">{t('tabs.skills.content.professional.levels.beginner', 'Beginner')}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('tabs.skills.content.professional.skills.publicSpeaking', 'Public Speaking')}</span>
                    <Badge variant="destructive">{t('tabs.skills.content.professional.levels.intermediate', 'Intermediate')}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('tabs.skills.content.professional.skills.negotiation', 'Negotiation')}</span>
                    <Badge variant="destructive">{t('tabs.skills.content.professional.levels.beginner', 'Beginner')}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('tabs.skills.content.professional.skills.networking', 'Networking')}</span>
                    <Badge variant="destructive">{t('tabs.skills.content.professional.levels.advanced', 'Advanced')}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  {t('tabs.skills.content.professional.action', 'Start Training')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.skills.content.assessment.title', 'Skills Assessment & Development Plan')}</CardTitle>
              <CardDescription>
                {t('tabs.skills.content.assessment.description', 'Personalized skill evaluation and growth roadmap')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">{t('tabs.skills.content.assessment.process.title', 'Assessment Process')}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                      <span className="text-sm">{t('tabs.skills.content.assessment.process.steps.initial', 'Initial skills evaluation')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <span className="text-sm">{t('tabs.skills.content.assessment.process.steps.goals', 'Goal setting and planning')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                      <span className="text-sm">{t('tabs.skills.content.assessment.process.steps.development', 'Skill development activities')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                      <span className="text-sm">{t('tabs.skills.content.assessment.process.steps.evaluation', 'Progress evaluation and certification')}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">{t('tabs.skills.content.assessment.benefits.title', 'Development Benefits')}</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.skills.content.assessment.benefits.items.personalized', 'Personalized learning paths')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.skills.content.assessment.benefits.items.mentorship', 'Expert mentorship and guidance')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.skills.content.assessment.benefits.items.certification', 'Industry-recognized certifications')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.skills.content.assessment.benefits.items.networking', 'Professional networking opportunities')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {t('tabs.skills.content.assessment.benefits.items.career', 'Career advancement support')}
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <Button>
                  {t('tabs.skills.content.assessment.actions.start', 'Start Assessment')}
                </Button>
                <Button variant="outline">
                  {t('tabs.skills.content.assessment.actions.schedule', 'Schedule Consultation')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'mentorship',
      label: t('tabs.mentorship.label', 'Mentorship'),
      icon: <Users className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                {t('tabs.mentorship.content.program.title', 'Mentorship Program Overview')}
              </CardTitle>
              <CardDescription>
                {t('tabs.mentorship.content.program.description', 'Connect with experienced professionals for guidance and career development')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.mentorship.content.program.features.matching.title', 'Smart Matching')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.mentorship.content.program.features.matching.description', 'AI-powered mentor-mentee pairing based on goals and interests')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.mentorship.content.program.features.flexible.title', 'Flexible Scheduling')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.mentorship.content.program.features.flexible.description', 'Virtual and in-person meetings that fit your schedule')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-8 w-8 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('tabs.mentorship.content.program.features.structured.title', 'Structured Program')}</h4>
                  <p className="text-sm text-gray-600">{t('tabs.mentorship.content.program.features.structured.description', 'Goal-oriented sessions with progress tracking and milestones')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.mentorship.content.mentors.title', 'Featured Mentors')}</CardTitle>
                <CardDescription>
                  {t('tabs.mentorship.content.mentors.description', 'Learn from accomplished professionals across various industries')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {t('tabs.mentorship.content.mentors.profiles.sarah.initials', 'SA')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{t('tabs.mentorship.content.mentors.profiles.sarah.name', 'Sarah Al-Mansouri')}</h4>
                      <p className="text-xs text-gray-600">{t('tabs.mentorship.content.mentors.profiles.sarah.title', 'Senior Technology Director')}</p>
                      <p className="text-xs text-gray-500">{t('tabs.mentorship.content.mentors.profiles.sarah.expertise', 'Expertise: Digital Innovation, Leadership')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                      {t('tabs.mentorship.content.mentors.profiles.ahmed.initials', 'AK')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{t('tabs.mentorship.content.mentors.profiles.ahmed.name', 'Ahmed Al-Kaabi')}</h4>
                      <p className="text-xs text-gray-600">{t('tabs.mentorship.content.mentors.profiles.ahmed.title', 'Entrepreneur & Business Consultant')}</p>
                      <p className="text-xs text-gray-500">{t('tabs.mentorship.content.mentors.profiles.ahmed.expertise', 'Expertise: Startups, Business Development')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {t('tabs.mentorship.content.mentors.profiles.fatima.initials', 'FH')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{t('tabs.mentorship.content.mentors.profiles.fatima.name', 'Fatima Al-Hashemi')}</h4>
                      <p className="text-xs text-gray-600">{t('tabs.mentorship.content.mentors.profiles.fatima.title', 'Government Affairs Specialist')}</p>
                      <p className="text-xs text-gray-500">{t('tabs.mentorship.content.mentors.profiles.fatima.expertise', 'Expertise: Public Policy, International Relations')}</p>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="w-full mt-4">
                  {t('tabs.mentorship.content.mentors.action', 'Browse All Mentors')}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('tabs.mentorship.content.success.title', 'Success Stories')}</CardTitle>
                <CardDescription>
                  {t('tabs.mentorship.content.success.description', 'Real impact from our mentorship relationships')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold text-sm">{t('tabs.mentorship.content.success.stories.omar.name', 'Omar Al-Zaabi')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.mentorship.content.success.stories.omar.quote', '"My mentor helped me transition from engineering to product management. The guidance was invaluable for my career growth."')}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {t('tabs.mentorship.content.success.stories.omar.outcome', 'Career Transition Success')}
                    </Badge>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold text-sm">{t('tabs.mentorship.content.success.stories.layla.name', 'Layla Al-Suwaidi')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.mentorship.content.success.stories.layla.quote', '"Through mentorship, I gained the confidence to start my own social enterprise. Now we\'re impacting hundreds of lives."')}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {t('tabs.mentorship.content.success.stories.layla.outcome', 'Entrepreneurship Success')}
                    </Badge>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold text-sm">{t('tabs.mentorship.content.success.stories.khalid.name', 'Khalid Al-Rashid')}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {t('tabs.mentorship.content.success.stories.khalid.quote', '"My mentor\'s network opened doors I never knew existed. I\'m now leading a team of 20+ professionals."')}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {t('tabs.mentorship.content.success.stories.khalid.outcome', 'Leadership Development')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.mentorship.content.application.title', 'How to Apply for Mentorship')}</CardTitle>
              <CardDescription>
                {t('tabs.mentorship.content.application.description', 'Simple steps to connect with your ideal mentor')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.mentorship.content.application.steps.profile.title', 'Complete Profile')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.mentorship.content.application.steps.profile.description', 'Share your background, goals, and interests')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.mentorship.content.application.steps.preferences.title', 'Set Preferences')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.mentorship.content.application.steps.preferences.description', 'Choose mentor criteria and meeting preferences')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.mentorship.content.application.steps.matching.title', 'Get Matched')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.mentorship.content.application.steps.matching.description', 'Our system finds compatible mentors for you')}</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">4</div>
                  <h4 className="font-semibold text-sm mb-2">{t('tabs.mentorship.content.application.steps.connect.title', 'Start Journey')}</h4>
                  <p className="text-xs text-gray-600">{t('tabs.mentorship.content.application.steps.connect.description', 'Begin your mentorship relationship and grow')}</p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Button size="lg">
                  {t('tabs.mentorship.content.application.action', 'Apply for Mentorship')}
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
      title={t('title', 'Youth Development')}
      description={t('description', 'Empowering young Emiratis through comprehensive development programs and opportunities')}
      icon={<Users className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="programs"
    />
  );
};

export default YouthDevelopmentPage;

