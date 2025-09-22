
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Quote, Award, Building, Clock, ChevronRight } from 'lucide-react';

interface SuccessStory {
  id: string;
  name: string;
  role: string;
  company: string;
  industry: string;
  avatar: string;
  story: string;
  achievements: string[];
  careerPath: string[];
  timeToSuccess: string;
  advice: string;
  skills: string[];
}

export const SuccessStories: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);

  const successStories: SuccessStory[] = [
    {
      id: '1',
      name: 'Ahmed Al Mansouri',
      role: 'Chief Technology Officer',
      company: 'Careem',
      industry: 'Technology',
      avatar: '/api/placeholder/150/150',
      story: 'Started as a junior developer and worked my way up through dedication to learning new technologies and leading innovative projects. The UAE tech scene has incredible opportunities for growth.',
      achievements: [
        'Led digital transformation initiative',
        'Built team of 50+ engineers',
        'Launched 3 major products',
        'Recognized as Tech Leader of the Year'
      ],
      careerPath: ['Junior Developer', 'Senior Developer', 'Team Lead', 'Engineering Manager', 'CTO'],
      timeToSuccess: '8 years',
      advice: 'Never stop learning and embrace new technologies. The UAE tech industry rewards innovation and hard work.',
      skills: ['Leadership', 'Software Architecture', 'AI/ML', 'Team Building']
    },
    {
      id: '2',
      name: 'Fatima Al Zahra',
      role: 'Senior Investment Manager',
      company: 'Emirates NBD',
      industry: 'Financial Services',
      avatar: '/api/placeholder/150/150',
      story: 'Joined as a graduate trainee and progressed through various roles in banking. The financial sector in UAE offers excellent career progression and learning opportunities.',
      achievements: [
        'Managed AED 500M+ portfolio',
        'Led regional expansion project',
        'Achieved 15% YoY growth',
        'Mentored 20+ junior analysts'
      ],
      careerPath: ['Graduate Trainee', 'Analyst', 'Associate', 'Vice President', 'Senior Investment Manager'],
      timeToSuccess: '6 years',
      advice: 'Build strong relationships and always focus on delivering value to clients. The banking sector values integrity and results.',
      skills: ['Financial Analysis', 'Risk Management', 'Client Relations', 'Strategic Planning']
    },
    {
      id: '3',
      name: 'Dr. Sarah Mohamed',
      role: 'Department Head - Cardiology',
      company: 'Cleveland Clinic Abu Dhabi',
      industry: 'Healthcare',
      avatar: '/api/placeholder/150/150',
      story: 'Completed medical training in UAE and specialized in cardiology. The healthcare sector here provides world-class facilities and opportunities for professional growth.',
      achievements: [
        'Performed 200+ cardiac procedures',
        'Published 15 research papers',
        'Led medical mission to Yemen',
        'Received Excellence in Patient Care Award'
      ],
      careerPath: ['Medical Student', 'Resident', 'Fellow', 'Specialist', 'Department Head'],
      timeToSuccess: '12 years',
      advice: 'Medicine requires dedication and continuous learning. UAE healthcare system offers excellent opportunities for specialization.',
      skills: ['Clinical Excellence', 'Research', 'Leadership', 'Patient Care']
    },
    {
      id: '4',
      name: 'Omar Al Rashid',
      role: 'General Manager',
      company: 'Jumeirah Beach Hotel',
      industry: 'Tourism & Hospitality',
      avatar: '/api/placeholder/150/150',
      story: 'Started in front desk operations and worked through various departments. The hospitality industry in UAE is vibrant and offers diverse career paths.',
      achievements: [
        'Increased hotel revenue by 25%',
        'Led team of 300+ staff',
        'Achieved 5-star rating consistently',
        'Launched sustainable tourism initiative'
      ],
      careerPath: ['Front Desk Associate', 'Supervisor', 'Assistant Manager', 'Department Manager', 'General Manager'],
      timeToSuccess: '10 years',
      advice: 'Customer service excellence and cultural sensitivity are key in hospitality. Learn multiple languages and understand diverse cultures.',
      skills: ['Hospitality Management', 'Customer Service', 'Cultural Awareness', 'Team Leadership']
    },
    {
      id: '5',
      name: 'Khalid Al Suwaidi',
      role: 'Project Director',
      company: 'ADNOC',
      industry: 'Oil & Gas',
      avatar: '/api/placeholder/150/150',
      story: 'Engineering graduate who joined ADNOC and progressed through technical and leadership roles. The energy sector offers stability and innovation opportunities.',
      achievements: [
        'Led $2B refinery project',
        'Improved operational efficiency by 30%',
        'Led sustainability initiatives',
        'Received ADNOC Excellence Award'
      ],
      careerPath: ['Graduate Engineer', 'Process Engineer', 'Senior Engineer', 'Project Manager', 'Project Director'],
      timeToSuccess: '9 years',
      advice: 'Combine technical excellence with business acumen. The energy sector is evolving towards sustainability - be part of that change.',
      skills: ['Project Management', 'Engineering', 'Leadership', 'Sustainability']
    },
    {
      id: '6',
      name: 'Mariam Al Blooshi',
      role: 'Development Director',
      company: 'Emaar Properties',
      industry: 'Real Estate',
      avatar: '/api/placeholder/150/150',
      story: 'Architecture graduate who transitioned into real estate development. UAE real estate sector offers opportunities to work on iconic projects.',
      achievements: [
        'Led development of landmark project',
        'Managed AED 800M+ projects',
        'Won Young Professional Award',
        'Pioneered sustainable building practices'
      ],
      careerPath: ['Junior Architect', 'Project Architect', 'Development Manager', 'Senior Manager', 'Development Director'],
      timeToSuccess: '7 years',
      advice: 'Understand both design and business aspects of real estate. The UAE market is dynamic and rewards innovation.',
      skills: ['Project Development', 'Architecture', 'Business Strategy', 'Sustainability']
    }
  ];

  const industries = ['all', 'Technology', 'Financial Services', 'Healthcare', 'Tourism & Hospitality', 'Oil & Gas', 'Real Estate'];

  const filteredStories = selectedIndustry === 'all' 
    ? successStories 
    : successStories.filter(story => story.industry === selectedIndustry);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-ehrdc-teal" />
            Success Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Learn from professionals who have built successful careers across UAE's major industries.
          </p>

          {/* Industry Filter */}
          <div className="mb-6">
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry}>
                    {industry === 'all' ? 'All Industries' : industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Success Stories Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {filteredStories.map((story) => (
              <Card key={story.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={story.avatar} alt={story.name} />
                      <AvatarFallback>{story.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{story.name}</h3>
                      <p className="text-sm text-muted-foreground">{story.role}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Building className="h-3 w-3 text-ehrdc-teal" />
                        <span className="text-sm">{story.company}</span>
                        <Badge variant="outline" className="text-xs">{story.industry}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <Quote className="h-4 w-4 text-ehrdc-teal mb-2" />
                    <p className="text-sm italic">{story.story}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-ehrdc-teal" />
                      <div>
                        <p className="text-xs text-muted-foreground">Time to Success</p>
                        <p className="font-medium">{story.timeToSuccess}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-ehrdc-teal" />
                      <div>
                        <p className="text-xs text-muted-foreground">Key Achievements</p>
                        <p className="font-medium">{story.achievements.length} milestones</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Career Path:</p>
                    <div className="flex items-center gap-1 text-xs">
                      {story.careerPath.slice(0, 3).map((step, index) => (
                        <React.Fragment key={index}>
                          <span className="bg-ehrdc-teal/10 text-ehrdc-teal px-2 py-1 rounded">
                            {step}
                          </span>
                          {index < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                        </React.Fragment>
                      ))}
                      {story.careerPath.length > 3 && (
                        <span className="text-muted-foreground">+{story.careerPath.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSelectedStory(story)}
                  >
                    Read Full Story
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Story Modal */}
      {selectedStory && (
        <Card className="border-ehrdc-teal">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedStory.avatar} alt={selectedStory.name} />
                  <AvatarFallback>{selectedStory.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedStory.name}</h3>
                  <p className="text-muted-foreground">{selectedStory.role} at {selectedStory.company}</p>
                  <Badge className="mt-1 bg-ehrdc-teal text-white">{selectedStory.industry}</Badge>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedStory(null)}
                className="text-ehrdc-teal border-ehrdc-teal"
              >
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Career Journey</h4>
                <div className="space-y-3">
                  {selectedStory.careerPath.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-ehrdc-teal/10 text-ehrdc-teal rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm">{step}</span>
                    </div>
                  ))}
                </div>

                <h4 className="font-semibold mb-3 mt-6">Key Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedStory.skills.map((skill, index) => (
                    <Badge key={index} variant="outline">{skill}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Major Achievements</h4>
                <ul className="space-y-2 mb-6">
                  {selectedStory.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Award className="h-4 w-4 text-ehrdc-teal mt-0.5 flex-shrink-0" />
                      {achievement}
                    </li>
                  ))}
                </ul>

                <h4 className="font-semibold mb-3">Advice for Aspiring Professionals</h4>
                <div className="bg-ehrdc-teal/5 p-4 rounded-lg">
                  <Quote className="h-5 w-5 text-ehrdc-teal mb-2" />
                  <p className="text-sm italic">{selectedStory.advice}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
