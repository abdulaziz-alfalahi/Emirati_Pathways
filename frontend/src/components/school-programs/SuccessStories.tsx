
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Quote, Star, Award, BookOpen } from 'lucide-react';

const SuccessStories: React.FC = () => {
  const stories = [
    {
      id: '1',
      studentName: 'Fatima Al-Zahra',
      age: 16,
      program: 'Advanced STEM Academy',
      institution: 'Dubai International School',
      achievement: 'Won National Science Fair',
      story: 'The STEM program opened my eyes to the world of robotics and artificial intelligence. Through hands-on projects and mentorship, I developed skills that helped me win the national science fair and secure a summer internship at a tech company.',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b2e5?w=400&h=400&fit=crop&crop=face',
      rating: 5,
      programDuration: '2 years',
      currentStatus: 'University Applicant'
    },
    {
      id: '2',
      studentName: 'Ahmed Hassan',
      age: 14,
      program: 'Young Entrepreneurs Program',
      institution: 'Business Leaders Academy',
      achievement: 'Launched Student Startup',
      story: 'Learning business fundamentals at such a young age gave me confidence to start my own small business. The program taught me about marketing, finance, and leadership skills that I use every day.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      rating: 5,
      programDuration: '6 months',
      currentStatus: 'Student Entrepreneur'
    },
    {
      id: '3',
      studentName: 'Mariam Abdullah',
      age: 15,
      program: 'Arabic Literary Excellence',
      institution: 'Emirates Heritage Academy',
      achievement: 'Published Poetry Collection',
      story: 'This program helped me connect with my cultural roots while developing my writing skills. I discovered my passion for Arabic poetry and have since published a collection that celebrates Emirati heritage.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      rating: 5,
      programDuration: '1 year',
      currentStatus: 'Published Author'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => (
          <Card key={story.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-ehrdc-neutral-light">
                  <img 
                    src={story.image} 
                    alt={story.studentName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{story.studentName}</CardTitle>
                  <p className="text-sm text-muted-foreground">Age {story.age} • {story.currentStatus}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: story.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 text-yellow-500 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-ehrdc-teal" />
                  <span className="text-sm font-medium">{story.program}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {story.institution} • {story.programDuration}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-ehrdc-teal" />
                <Badge variant="secondary" className="bg-ehrdc-teal/10 text-ehrdc-teal">
                  {story.achievement}
                </Badge>
              </div>
              
              <div className="relative">
                <Quote className="absolute -top-2 -start-1 h-6 w-6 text-ehrdc-teal/20" />
                <p className="text-sm text-muted-foreground italic ps-6 leading-relaxed">
                  "{story.story}"
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center pt-6">
        <Card className="bg-gradient-to-r from-ehrdc-teal/5 to-ehrdc-light-teal/5 border-ehrdc-teal/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Award className="h-8 w-8 text-ehrdc-teal" />
              <div>
                <h3 className="text-xl font-semibold text-ehrdc-teal">Share Your Success Story</h3>
                <p className="text-sm text-muted-foreground">
                  Inspire other students by sharing your journey and achievements
                </p>
              </div>
            </div>
            <button className="ehrdc-button-primary">
              Submit Your Story
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuccessStories;
