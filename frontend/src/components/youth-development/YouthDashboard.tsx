
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Star, Target, TrendingUp, Calendar, Users, Award, BookOpen } from 'lucide-react';

export const YouthDashboard: React.FC = () => {
  const achievements = [
    { id: '1', title: 'Leadership Pioneer', icon: '🏆', description: 'Completed Leadership Foundation Program', earned: true },
    { id: '2', title: 'Innovation Star', icon: '⭐', description: 'Participated in 3 innovation workshops', earned: true },
    { id: '3', title: 'Community Hero', icon: '❤️', description: 'Completed 50+ volunteer hours', earned: false, progress: 70 },
    { id: '4', title: 'Cultural Ambassador', icon: '🎭', description: 'Mastered traditional Emirati art form', earned: false, progress: 30 }
  ];

  const enrolledPrograms = [
    { id: '1', name: 'Young Entrepreneurs Program', progress: 75, nextSession: '2024-02-15', type: 'Innovation' },
    { id: '2', name: 'Digital Arts Workshop', progress: 40, nextSession: '2024-02-12', type: 'Arts' },
    { id: '3', name: 'Community Leadership Track', progress: 90, nextSession: '2024-02-18', type: 'Leadership' }
  ];

  const recommendations = [
    { id: '1', title: 'Sustainable Innovation Challenge', category: 'Innovation', match: 95 },
    { id: '2', title: 'Public Speaking Mastery', category: 'Leadership', match: 88 },
    { id: '3', title: 'Traditional Calligraphy Workshop', category: 'Cultural Heritage', match: 82 }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-ehrdc-teal to-ehrdc-dark-teal text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome back, Ahmed!</h2>
              <p className="text-ehrdc-neutral-light">Continue your journey of growth and discovery</p>
            </div>
            <Avatar className="h-16 w-16 ring-4 ring-white/20">
              <AvatarImage src="/lovable-uploads/73a334b5-2916-40e6-8daf-ad4a26f78bfb.png" />
              <AvatarFallback>AH</AvatarFallback>
            </Avatar>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-ehrdc-teal mx-auto mb-2" />
            <div className="text-2xl font-bold text-ehrdc-teal">12</div>
            <div className="text-sm text-muted-foreground">Achievements</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-8 w-8 text-ehrdc-teal mx-auto mb-2" />
            <div className="text-2xl font-bold text-ehrdc-teal">3</div>
            <div className="text-sm text-muted-foreground">Active Programs</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-ehrdc-teal mx-auto mb-2" />
            <div className="text-2xl font-bold text-ehrdc-teal">2</div>
            <div className="text-sm text-muted-foreground">Mentors</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-ehrdc-teal mx-auto mb-2" />
            <div className="text-2xl font-bold text-ehrdc-teal">85%</div>
            <div className="text-sm text-muted-foreground">Goal Progress</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Achievement Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-ehrdc-teal" />
              Achievement Badges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <div className="font-medium">{achievement.title}</div>
                    <div className="text-sm text-muted-foreground">{achievement.description}</div>
                    {!achievement.earned && achievement.progress && (
                      <div className="mt-2">
                        <Progress value={achievement.progress} className="h-2 w-32" />
                        <div className="text-xs text-muted-foreground mt-1">{achievement.progress}% complete</div>
                      </div>
                    )}
                  </div>
                </div>
                {achievement.earned && (
                  <Badge className="bg-ehrdc-teal text-white">Earned</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Program Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-ehrdc-teal" />
              Your Programs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrolledPrograms.map((program) => (
              <div key={program.id} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{program.name}</div>
                  <Badge variant="outline">{program.type}</Badge>
                </div>
                <Progress value={program.progress} className="h-2 mb-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{program.progress}% complete</span>
                  <span>Next: {new Date(program.nextSession).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            <Button className="w-full" variant="outline">
              View All Programs
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-ehrdc-teal" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 rounded-lg border hover:shadow-md transition-shadow">
                <div className="font-medium mb-2">{rec.title}</div>
                <Badge variant="outline" className="mb-3">{rec.category}</Badge>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{rec.match}% match</div>
                  <Button size="sm" className="ehrdc-button-primary">
                    Learn More
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
