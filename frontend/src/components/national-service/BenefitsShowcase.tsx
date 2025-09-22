
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Award, TrendingUp, GraduationCap, Shield, Building, 
  Star, Users, Heart, CheckCircle, Quote 
} from 'lucide-react';

export const BenefitsShowcase: React.FC = () => {
  const [selectedBenefit, setSelectedBenefit] = useState('career');

  const careerAdvantages = [
    {
      title: 'Leadership Experience',
      description: 'Proven track record of leading teams under pressure',
      value: '+25% hiring preference',
      icon: Users
    },
    {
      title: 'Discipline & Reliability',
      description: 'Strong work ethic and commitment to excellence',
      value: '95% retention rate',
      icon: Shield
    },
    {
      title: 'Problem-Solving Skills',
      description: 'Ability to think critically and adapt quickly',
      value: 'Top performance reviews',
      icon: Star
    },
    {
      title: 'Security Clearance',
      description: 'Enhanced security clearance for government roles',
      value: 'Premium positions access',
      icon: Award
    }
  ];

  const employerPerspectives = [
    {
      company: 'Emirates Airlines',
      executive: 'Sarah Al-Mansouri, HR Director',
      quote: 'Veterans bring exceptional discipline and leadership qualities that strengthen our teams.',
      rating: 5
    },
    {
      company: 'ADNOC',
      executive: 'Ahmed Al-Zaabi, Talent Manager',
      quote: 'Military experience translates directly to operational excellence in our industry.',
      rating: 5
    },
    {
      company: 'Dubai Police',
      executive: 'Fatima Al-Marri, Recruitment Head',
      quote: 'National service alumni consistently exceed performance expectations.',
      rating: 5
    }
  ];

  const educationalBenefits = [
    {
      type: 'University Scholarships',
      description: 'Full tuition coverage for bachelor\'s and master\'s degrees',
      eligibility: 'All service members',
      value: 'Up to AED 200,000'
    },
    {
      type: 'Professional Certifications',
      description: 'Industry-recognized certifications in various fields',
      eligibility: 'Based on career path',
      value: 'Up to AED 50,000'
    },
    {
      type: 'Language Training',
      description: 'English and other language proficiency programs',
      eligibility: 'All service members',
      value: 'Up to AED 25,000'
    },
    {
      type: 'Technical Skills',
      description: 'Digital skills and technology training programs',
      eligibility: 'Based on aptitude',
      value: 'Up to AED 75,000'
    }
  ];

  const specialOpportunities = [
    {
      sector: 'Government',
      opportunity: 'Reserved Positions Program',
      description: '30% of government positions reserved for veterans',
      application: 'Direct application channel'
    },
    {
      sector: 'Private Sector',
      opportunity: 'Veteran Hiring Initiative',
      description: 'Fast-track recruitment with partner companies',
      application: 'Priority consideration'
    },
    {
      sector: 'Entrepreneurship',
      opportunity: 'Veteran Business Support',
      description: 'Startup funding and mentorship programs',
      application: 'Special funding rates'
    },
    {
      sector: 'Security',
      opportunity: 'Security Sector Excellence',
      description: 'Leadership roles in security and defense',
      application: 'Enhanced clearance access'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Benefits Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">National Service Career Advantages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {careerAdvantages.map((advantage, index) => {
              const IconComponent = advantage.icon;
              return (
                <div key={index} className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="bg-ehrdc-teal/10 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <IconComponent className="h-8 w-8 text-ehrdc-teal" />
                  </div>
                  <h3 className="font-semibold mb-2">{advantage.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{advantage.description}</p>
                  <Badge variant="outline" className="text-green-700 border-green-200">
                    {advantage.value}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Benefits Tabs */}
      <Tabs value={selectedBenefit} onValueChange={setSelectedBenefit} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="career">Career Benefits</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="employers">Employers</TabsTrigger>
          <TabsTrigger value="opportunities">Special Programs</TabsTrigger>
        </TabsList>

        <TabsContent value="career" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Career Advancement Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-600 mb-3" />
                  <h3 className="font-semibold mb-2">Faster Promotions</h3>
                  <p className="text-sm text-gray-600">Veterans advance 40% faster than civilian counterparts</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <Award className="h-8 w-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold mb-2">Higher Starting Salaries</h3>
                  <p className="text-sm text-gray-600">Average 15-20% premium over standard entry-level positions</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <Building className="h-8 w-8 text-purple-600 mb-3" />
                  <h3 className="font-semibold mb-2">Leadership Opportunities</h3>
                  <p className="text-sm text-gray-600">Direct path to management roles with proven leadership skills</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Educational Benefits & Scholarships</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {educationalBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                    <GraduationCap className="h-6 w-6 text-ehrdc-teal mt-1" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{benefit.type}</h3>
                        <Badge className="bg-green-100 text-green-800">{benefit.value}</Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{benefit.description}</p>
                      <p className="text-sm text-ehrdc-teal">Eligibility: {benefit.eligibility}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What Employers Say About Veterans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {employerPerspectives.map((perspective, index) => (
                  <div key={index} className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-4">
                      <Quote className="h-8 w-8 text-ehrdc-teal mt-1" />
                      <div className="flex-1">
                        <p className="text-lg italic mb-4">"{perspective.quote}"</p>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{perspective.executive}</p>
                            <p className="text-ehrdc-teal">{perspective.company}</p>
                          </div>
                          <div className="flex gap-1">
                            {Array.from({ length: perspective.rating }, (_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Special Opportunities for Veterans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {specialOpportunities.map((opportunity, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">{opportunity.opportunity}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{opportunity.description}</p>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{opportunity.sector}</Badge>
                      <span className="text-xs text-ehrdc-teal">{opportunity.application}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-red-50 to-green-50">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-4">Ready to Leverage Your Service Experience?</h3>
          <p className="text-gray-600 mb-6">Join thousands of veterans who have successfully transitioned to rewarding civilian careers.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
              Start Your Transition
            </Button>
            <Button variant="outline">
              Connect with Mentor
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
