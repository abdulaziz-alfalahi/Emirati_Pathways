
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, BookOpen, Calendar } from 'lucide-react';

export const MyLearningTab: React.FC = () => {
  const enrollments = [
    {
      id: '1',
      title: 'Digital Marketing Fundamentals',
      provider: 'UAE Digital Academy',
      progress: 75,
      status: 'In Progress',
      nextSession: '2024-06-20',
      totalHours: 40,
      completedHours: 30
    },
    {
      id: '2',
      title: 'Data Analytics with Python',
      provider: 'Tech Skills Institute',
      progress: 45,
      status: 'In Progress',
      nextSession: '2024-06-22',
      totalHours: 60,
      completedHours: 27
    },
    {
      id: '3',
      title: 'Project Management Essentials',
      provider: 'Business Excellence Center',
      progress: 20,
      status: 'Recently Started',
      nextSession: '2024-06-21',
      totalHours: 35,
      completedHours: 7
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-[rgb(var(--pg-secondary))] text-white';
      case 'Recently Started':
        return 'bg-[rgb(var(--pg-accent))] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 text-[rgb(var(--pg-secondary))] mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Active Learning Programs</h3>
        <p className="text-muted-foreground mb-6">
          Start your learning journey by enrolling in training programs
        </p>
        <Button className="bg-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))/90] text-white">
          Browse Available Programs
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {enrollments.map((enrollment) => (
        <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start mb-2">
              <CardTitle className="text-lg leading-tight">{enrollment.title}</CardTitle>
              <Badge className={getStatusColor(enrollment.status)}>
                {enrollment.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{enrollment.provider}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span className="font-medium">{enrollment.progress}%</span>
              </div>
              <Progress 
                value={enrollment.progress} 
                className="h-2"
              />
            </div>
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{enrollment.completedHours}/{enrollment.totalHours}h</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Next: {new Date(enrollment.nextSession).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                className="flex-1 bg-[rgb(var(--pg-primary))] hover:bg-[rgb(var(--pg-primary))/90] text-white"
              >
                <Play className="h-4 w-4 me-2" />
                Continue
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
