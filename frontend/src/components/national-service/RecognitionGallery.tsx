
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Medal, Trophy, Star, Play, Award, TrendingUp } from 'lucide-react';

export const RecognitionGallery: React.FC = () => {
  const successStories = [
    {
      name: 'Ahmed Al-Mansouri',
      currentRole: 'Security Director, Dubai International Airport',
      serviceBackground: 'Military Police, 2 years',
      achievement: 'Rose to executive level within 5 years of service completion',
      quote: 'Military service taught me leadership and crisis management skills that are invaluable in airport security.',
      image: '/api/placeholder/100/100',
      videoAvailable: true
    },
    {
      name: 'Fatima Al-Zahra',
      currentRole: 'Cybersecurity Analyst, Emirates NBD',
      serviceBackground: 'Communications Specialist, 2 years',
      achievement: 'Leading digital security initiatives for UAE banking sector',
      quote: 'The technical training during service gave me a strong foundation in cybersecurity.',
      image: '/api/placeholder/100/100',
      videoAvailable: false
    }
  ];

  const awards = [
    {
      title: 'Excellence in Service Transition',
      recipient: 'Mohammed Al-Rashid',
      year: '2023',
      description: 'Outstanding career development from military logistics to supply chain management'
    },
    {
      title: 'Innovation Leadership Award',
      recipient: 'Sara Al-Mahmoud',
      year: '2023',
      description: 'Pioneering veteran entrepreneurship in renewable energy sector'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Success Stories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Veteran Success Stories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {successStories.map((story, index) => (
              <div key={index} className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <Star className="h-8 w-8 text-ehrdc-teal" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{story.name}</h3>
                        <p className="text-ehrdc-teal font-medium">{story.currentRole}</p>
                      </div>
                      {story.videoAvailable && (
                        <Button size="sm" variant="outline">
                          <Play className="h-4 w-4 me-1" />
                          Watch Video
                        </Button>
                      )}
                    </div>
                    
                    <Badge variant="outline" className="mb-3">{story.serviceBackground}</Badge>
                    
                    <p className="text-gray-600 italic mb-3">"{story.quote}"</p>
                    
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">{story.achievement}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Awards and Recognition */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Awards & Recognition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {awards.map((award, index) => (
              <div key={index} className="p-4 border rounded-lg text-center">
                <Medal className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">{award.title}</h3>
                <p className="text-ehrdc-teal font-medium mb-2">{award.recipient}</p>
                <Badge variant="outline" className="mb-3">{award.year}</Badge>
                <p className="text-sm text-gray-600">{award.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
