
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, TrendingUp, Building, Calendar, Quote } from 'lucide-react';

export const SuccessStories: React.FC = () => {
  const [selectedCertification, setSelectedCertification] = useState('all');

  const successStories = [
    {
      id: '1',
      name: 'Ahmed Al-Mansouri',
      title: 'Senior Cloud Architect',
      company: 'Emirates NBD',
      location: 'Dubai, UAE',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      certification: 'AWS Solutions Architect - Professional',
      completedDate: '2023-08-15',
      careerImpact: {
        salaryIncrease: '45%',
        promotion: 'Senior Architect',
        timeToPromotion: '6 months'
      },
      story: "Getting my AWS certification was a game-changer. Within 6 months, I was promoted to Senior Cloud Architect and my salary increased by 45%. The knowledge I gained helped me lead our digital transformation initiative.",
      keyTakeaways: [
        'Hands-on experience is crucial',
        'Study consistently for 3 months',
        'Practice with real AWS services',
        'Join study groups for motivation'
      ],
      previousRole: 'Cloud Engineer',
      studyDuration: '4 months',
      attempts: 1
    },
    {
      id: '2',
      name: 'Fatima Al-Zahra',
      title: 'Investment Manager',
      company: 'ADIB',
      location: 'Abu Dhabi, UAE',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
      certification: 'CFA Level 1',
      completedDate: '2023-12-10',
      careerImpact: {
        salaryIncrease: '35%',
        promotion: 'Investment Manager',
        timeToPromotion: '8 months'
      },
      story: "The CFA certification opened doors I never imagined. The comprehensive curriculum gave me deep insights into investment analysis and portfolio management. Now I'm managing a AED 500M portfolio.",
      keyTakeaways: [
        'Start early - minimum 6 months prep',
        'Focus on weak areas',
        'Use multiple study materials',
        'Take practice exams regularly'
      ],
      previousRole: 'Financial Analyst',
      studyDuration: '8 months',
      attempts: 1
    },
    {
      id: '3',
      name: 'Omar Abdullah',
      title: 'Project Director',
      company: 'Emaar Properties',
      location: 'Dubai, UAE',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      certification: 'PMP',
      completedDate: '2023-09-22',
      careerImpact: {
        salaryIncrease: '40%',
        promotion: 'Project Director',
        timeToPromotion: '4 months'
      },
      story: "The PMP certification validated my project management experience and gave me frameworks I use daily. Leading the Downtown Dubai expansion project became much more structured and successful.",
      keyTakeaways: [
        'Document your PM experience first',
        'Understand PMBOK thoroughly',
        'Practice with real scenarios',
        'Network with other PMPs'
      ],
      previousRole: 'Senior Project Manager',
      studyDuration: '5 months',
      attempts: 1
    }
  ];

  const filteredStories = successStories.filter(story => {
    return selectedCertification === 'all' || story.certification === selectedCertification;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Success Stories</h2>
          <p className="text-muted-foreground">Real testimonials from Emiratis who advanced their careers through certifications</p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Certification</label>
              <Select value={selectedCertification} onValueChange={setSelectedCertification}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Certification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Certifications</SelectItem>
                  <SelectItem value="AWS Solutions Architect - Professional">AWS Solutions Architect</SelectItem>
                  <SelectItem value="CFA Level 1">CFA Level 1</SelectItem>
                  <SelectItem value="PMP">Project Management Professional</SelectItem>
                  <SelectItem value="CISSP">CISSP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full bg-slate-800 hover:bg-slate-700">
                Share Your Story
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Success Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">89%</div>
              <div className="text-muted-foreground">Career Advancement Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">42%</div>
              <div className="text-muted-foreground">Average Salary Increase</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">6.2</div>
              <div className="text-muted-foreground">Months to Promotion</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">94%</div>
              <div className="text-muted-foreground">Would Recommend</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Stories */}
      <div className="space-y-6">
        {filteredStories.map((story) => (
          <Card key={story.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Profile Section */}
                <div className="flex items-start gap-4 lg:w-80">
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <img 
                      src={story.avatar} 
                      alt={story.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{story.name}</h3>
                    <p className="text-muted-foreground text-sm mb-1">{story.title}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <Building className="h-3 w-3" />
                      {story.company}
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      <Award className="h-3 w-3 me-1" />
                      {story.certification}
                    </Badge>
                  </div>
                </div>

                {/* Story Content */}
                <div className="flex-1">
                  <div className="mb-4">
                    <Quote className="h-6 w-6 text-slate-400 mb-2" />
                    <p className="text-muted-foreground italic leading-relaxed">
                      "{story.story}"
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium mb-2 text-sm">Career Impact</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Salary Increase:</span>
                          <span className="text-green-600 font-medium">{story.careerImpact.salaryIncrease}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Promotion:</span>
                          <span className="font-medium">{story.careerImpact.promotion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time to Promotion:</span>
                          <span className="font-medium">{story.careerImpact.timeToPromotion}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 text-sm">Study Details</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Study Duration:</span>
                          <span className="font-medium">{story.studyDuration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Exam Attempts:</span>
                          <span className="font-medium">{story.attempts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span className="font-medium">{story.completedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 text-sm">Key Takeaways</h4>
                    <div className="grid md:grid-cols-2 gap-2">
                      {story.keyTakeaways.map((takeaway, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                          <span>{takeaway}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:w-40">
                  <Button size="sm" variant="outline">
                    Contact {story.name.split(' ')[0]}
                  </Button>
                  <Button size="sm" variant="outline">
                    View Certification
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-slate-50 to-blue-50">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Share Your Success Story</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Inspire fellow Emiratis by sharing how professional certifications advanced your career. 
            Your story could help others make informed decisions about their professional development.
          </p>
          <div className="flex justify-center gap-4">
            <Button className="bg-slate-800 hover:bg-slate-700">
              Submit Your Story
            </Button>
            <Button variant="outline">
              View All Stories
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
