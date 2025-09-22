
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Award, Heart } from 'lucide-react';

export const SuccessStoriesTab: React.FC = () => {
  // Placeholder content for success stories
  const placeholderStories = [
    {
      id: '1',
      name: 'Fatima Al-Zahra',
      title: 'Community Health Champion',
      story: 'Led a health awareness campaign that reached over 2,000 residents in her community, resulting in a 40% increase in health screenings.',
      impact: '2,000+ people reached',
      image: '/placeholder-avatar-1.jpg'
    },
    {
      id: '2',
      name: 'Ahmed Al-Mansouri',
      title: 'Youth Program Director',
      story: 'Established after-school programs that have helped 150+ young people develop leadership skills and pursue higher education.',
      impact: '150+ youth empowered',
      image: '/placeholder-avatar-2.jpg'
    },
    {
      id: '3',
      name: 'Mariam Al-Rashid',
      title: 'Environmental Leader',
      story: 'Organized community recycling initiatives that diverted 5 tons of waste from landfills and educated 500+ families about sustainability.',
      impact: '5 tons waste diverted',
      image: '/placeholder-avatar-3.jpg'
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-ehrdc-teal/10 to-ehrdc-light-teal/10 border-ehrdc-teal/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Award className="h-6 w-6 text-ehrdc-teal" />
            <h3 className="text-lg font-semibold text-ehrdc-teal">Inspiring Community Leaders</h3>
          </div>
          <p className="text-gray-700">
            Discover how community leaders across the UAE are making a positive impact in their neighborhoods 
            and creating lasting change. Their stories inspire others to step up and lead.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {placeholderStories.map((story) => (
          <Card key={story.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-ehrdc-teal/10 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-ehrdc-teal" />
                </div>
                <div>
                  <CardTitle className="text-lg">{story.name}</CardTitle>
                  <p className="text-sm text-ehrdc-teal font-medium">{story.title}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                {story.story}
              </p>
              
              <div className="flex items-center gap-2 p-3 bg-ehrdc-light-teal/20 rounded-lg">
                <Heart className="h-4 w-4 text-ehrdc-teal flex-shrink-0" />
                <span className="text-sm font-medium text-ehrdc-teal">
                  Impact: {story.impact}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-ehrdc-neutral-light">
        <CardContent className="p-6 text-center">
          <h4 className="font-semibold mb-3">Share Your Success Story</h4>
          <p className="text-gray-600 mb-4">
            Are you a community leader with an inspiring story? We'd love to feature your impact and inspire others.
          </p>
          <p className="text-sm text-gray-500">
            Contact us to share your community leadership journey and the positive changes you've created.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
